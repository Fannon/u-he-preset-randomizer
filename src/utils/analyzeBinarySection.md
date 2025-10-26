# Binary Section Findings

> Notes from reverse-engineering the `// Section for ugly compressed binary Data` block inside Zebralette 3 presets.

## Structure Overview

```
// Section for ugly compressed binary Data
// DON'T TOUCH THIS

$$$$<decimal byte count?>          ← header intro
<colon-separated header tokens>    ← base‑16 data using alphabet a–p
:<custom base64 payload>           ← alphabet !0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
<NUL><NUL>                         ← file terminator
```

- The very first line after the comment is always `$$$$<number>`. For *Basic Shapes* the value is `282372`, which matches the **post-decompression** size that the synth expects, so this appears to be the authoritative uncompressed byte count / checksum hint.
- Header tokens only use the 16 letters `a…p`. Treat each letter as a nibble (`a=0 … p=15`) to recover raw bytes; most tokens encode 32-bit words, but 1–2 character tokens become single bytes. The short tokens appear to be flags/defaults (`ea → 0x40`, `p → 0x0F`, etc.). Across the 59 supplied Zebralette 3 presets every token (except one) decoded cleanly using this alphabet.
- One token, `?klkkkkdo`, does **not** follow the nibble alphabet and currently remains undecoded—it likely carries a chunk identifier or checksum. The compare script confirms this token shows up in every preset and is the only undecoded entry.
- After the final header token there is a single colon followed by the payload, which is base64-like but with the custom alphabet above. Remove line breaks before decoding.

## Header Anatomy (Basic Shapes)

| Token       | Bytes (hex) | Notes |
|-------------|-------------|-------|
| klkkckdp    | ab aa 2a 3f | 32‑bit word (unknown) |
| aaaaaadp    | 00 00 00 3f | 0x3f |
| aaaaiadp    | 00 00 80 3f | 1.0f |
| abaaaaaa    | 01 00 00 00 | 1 |
| haceaaaa    | 70 24 00 00 | 0x00242470 |
| gdgceneb    | 63 62 4d 41 | ASCII `cbMA` (little-endian `AMbc`) |
| ...         | ...         | ... |
| mm          | cc          | |
| hc          | 72          | |
| mn          | cd          | |
| ed          | 43          | |
| hg          | 76          | |
| hn          | 7d          | |

The concatenation of all decoded header bytes for Basic Shapes is 62 bytes. Every Zebralette 3 preset inspected so far keeps the same length, though per-token contents vary (see tooling below).

## Payload Characteristics

- Custom base64 alphabet (length 64, no padding character). Decoding yields 42,756 bytes for *Basic Shapes*.
- When prepending the header bytes we obtain a 42,818-byte “binary blob”. The declared size (`282372`) suggests there is still at least one compression or encoding layer that the synth inflates internally—standard compressors (zlib/deflate/gzip/bzip2/lzma/zstd/lz4/brotli) failed on the blob directly.
- Treating the blob as little-endian floats surfaces reasonable ranges (0.0–1.0, 0.5, etc.) intermixed with huge/out-of-range values, so the payload probably interleaves structured data and raw binary (e.g., wavetables + envelopes).
- The payload size varies per preset: across 59 presets we observed lengths between 42,383 bytes and 44,628 bytes, but the header stayed fixed at 62 bytes.
- Declared sizes (`$$$$` line) currently take only two values in the supplied library: `282372` (48 presets) and `281920` (11 presets). This hints at at least two internal formats (e.g., different wavetable resolutions) even though the header structure remains constant.

## Dataset snapshot (59 Zebralette 3 presets)

| Metric | Observation |
|--------|-------------|
| Header byte length | Always 62 bytes |
| Payload byte length | 59 unique values between 42,383 and 44,628 bytes (most around 43–44 KB) |
| Declared post-decode size | Only two values: 28,2372 bytes (48 presets), 281,920 bytes (11 presets) |
| Undecoded tokens | Always `?klkkkkdo` only |
| Header token variability | Every nibble token decodes to the same hex value in all presets; only the payload differs |

This snapshot was produced with `src/utils/compareBinaryHeaders.ts` against the files in `tmp/Zebralette 3/`.

## Tooling

### `parseBinarySection`

- Location: `src/binarySection.ts`.
- Exported via `src/parser.ts`.
- Responsibilities:
  - Split header/payload.
  - Decode nibble tokens into bytes (with decimal helper when values fit 32/64-bit).
  - Decode the custom base64 payload.
  - Return metadata (`declaredUncompressedSize`, `headerFields`, `headerBytes`, `payloadBytes`, `combinedBytes`, `undecodedTokens`).

### `src/utils/analyzeBinarySection.ts`

CLI helper for ad-hoc inspection:

```bash
npx tsx src/utils/analyzeBinarySection.ts "tmp/Zebralette 3/Basic Shapes.h2p" tmp/BasicShapes.decoded.bin
```

Outputs the decoded header table, payload/header lengths, writes the combined blob to the requested path, and flags undecoded tokens.

### `src/utils/compareBinaryHeaders.ts`

Scans a directory of presets and reports how header tokens, payload sizes, and declared sizes vary:

```bash
npx tsx src/utils/compareBinaryHeaders.ts "tmp/Zebralette 3"
```

Helpful to spot which tokens change per preset or whether multiple declared sizes exist.

### `src/utils/binarySectionToJson.ts`

Converts a preset's binary section into JSON-friendly data (header fields plus payload encodings). By default it emits all payload words as 32-bit little-endian integers; use `--encodings` to control outputs and `--max` to limit array lengths.

```bash
npx tsx src/utils/binarySectionToJson.ts "tmp/Zebralette 3/Basic Shapes.h2p" tmp/BasicShapes.binary.json --encodings=uint16,uint32,float32 --max=32
```

The resulting JSON can be diffed, inspected, or loaded into other tooling without handling raw buffers.

### JSON structure

`binarySectionToJson()` produces the following high-level shape:

```jsonc
{
  "declaredUncompressedSize": 282372,
  "header": {
    "klkkckdp": {
      "token": "klkkckdp",
      "byteLength": 4,
      "hex": "abaa2a3f",
      "ascii": null,
      "uintBE": 2880055871,
      "uintLE": 1052327487,
      "float32LE": -1.2090952e-12,
      "float32BE": -0.0013055808
    },
    "...": {}
  },
  "undecodedTokens": ["?klkkkkdo"],
  "payload": {
    "byteLength": 42756,
    "uint32LittleEndian": [4227857858, 2870097868, ...],
    "float32LittleEndian": [-1.53e+34, -0.00154, ...],
    "uint16LittleEndian": [41186, 63582, ...],
    "base64": "wqA8+MI..." // optional, only when requested
  }
}
```

- Header entries capture multiple numeric interpretations of each token, along with ASCII hints when bytes form readable strings (e.g., `gdgceneb` → `cbMA`).
- Payload encodings are opt-in via `--encodings` so you can keep JSON files manageable. `--max` limits how many numbers get emitted per encoding (useful for quick comparisons).
- Combined with git diffs, this JSON output becomes a convenient way to check whether two presets share the same binary chunk without dumping raw buffers.

### Suggested workflow

1. **Decode a preset**: `npx tsx src/utils/analyzeBinarySection.ts "<preset>.h2p" tmp/<preset>.decoded.bin` – creates the raw binary blob for deeper inspection.
2. **Summarize / diff**: `npx tsx src/utils/compareBinaryHeaders.ts "<directory>"` – highlights payload-length outliers or new declared sizes after adding presets.
3. **Emit JSON**: `npx tsx src/utils/binarySectionToJson.ts "<preset>.h2p" tmp/<preset>.binary.json --encodings=uint16,uint32,float32 --max=2048` – produces structured data for tooling or notebooks.
4. **Test coverage**: `npm test binarySection.test.ts` – sanity check before committing changes touching parsing or serialization.

### Tests

`npm test binarySection.test.ts` now:

- Verifies the Basic Shapes chunk decodes and reports expected metadata.
- Loads every preset under `tmp/Zebralette 3/`, decodes each binary section, and ensures header/payload lengths are sensible (guarding future regressions).
- Confirms that `binarySectionToJson()` emits consistent metadata and that payload encoders respect the max-entry limit.

## Current Understanding

1. Header tokens = base16 words using the `a…p` alphabet (plus one unexplained token starting with `?`).
2. Payload uses a non-standard base64 alphabet (no padding, newline breaks ignored).
3. Combined blob is still encoded/compressed—final codec unknown but uncompressed size is declared up front.
4. Binary sections differ per preset, but share a stable structure (same number of header tokens, similar payload lengths). Within the supplied data, **every** decoded header token besides `?klkkkkdo` holds the same hex value across presets, implying that the actual variability lives mostly in the payload and not the header words.

## Open Questions / Next Work

1. **Final compression layer** – figure out how to inflate the 42 KB blob up to the declared ~282 KB. Hypothesis: u-he might be using a custom delta/lattice coder or known format with a transformed header.
   - Potential approaches: capture in-memory buffers from the plugin, brute-force compression detection on a subset, or look for repeating blocks/patterns within the payload to guess dictionary sizes.
2. **Header semantics** – correlate field deltas across broader preset sets (maybe from other synths) to map tokens to meaningful entities (sample rate? waveform length? flags?). Currently all Zebralette tokens stay constant, so we will likely need presets from different synths or editor builds to see this change.
3. **Binary interpreters** – once the structure is clearer, expose helpers that decode sub-sections (e.g., wavetables, MSEG points) so randomization/merging can eventually operate on them safely. The JSON emitter already provides the scaffolding for plugging in such interpreters.
4. **Automated diffing** – build on `binarySectionToJson` to generate summary stats (min/max/variance per payload slice) so that randomization algorithms can reason about realistic ranges even without decoding the final compression.
