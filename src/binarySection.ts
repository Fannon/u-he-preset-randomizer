import { Buffer } from 'node:buffer';

const BASE64_ALPHABET =
  '!0123456789=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE64_LOOKUP = new Map(
  Array.from(BASE64_ALPHABET).map((char, index) => [char, index]),
);

const NIBBLE_ALPHABET = 'abcdefghijklmnop';
const NIBBLE_LOOKUP = new Map(
  Array.from(NIBBLE_ALPHABET).map((char, index) => [char, index]),
);

export interface BinaryHeaderField {
  token: string;
  bytes: Buffer;
  decimalValue?: number;
}

export interface ParsedBinarySection {
  declaredUncompressedSize?: number;
  headerFields: BinaryHeaderField[];
  undecodedTokens: string[];
  headerBytes: Buffer;
  payloadBytes: Buffer;
  combinedBytes: Buffer;
}

export interface BinaryHeaderJson {
  token: string;
  byteLength: number;
  hex: string;
  ascii?: string;
  uintBE?: number;
  uintLE?: number;
  float32LE?: number;
  float32BE?: number;
}

export interface BinaryPayloadJson {
  byteLength: number;
  base64?: string;
  uint16LittleEndian?: number[];
  uint32LittleEndian?: number[];
  float32LittleEndian?: number[];
}

export interface BinarySectionJson {
  declaredUncompressedSize?: number;
  header: Record<string, BinaryHeaderJson>;
  undecodedTokens: string[];
  payload: BinaryPayloadJson;
}

export interface BinarySectionJsonOptions {
  includePayloadEncodings?: Array<'base64' | 'uint16' | 'uint32' | 'float32'>;
  maxPayloadEntries?: number;
}

function decodeNibbleToken(token: string): Buffer | null {
  if (!token) {
    return null;
  }
  const nibbles: number[] = [];
  for (const char of token) {
    const value = NIBBLE_LOOKUP.get(char);
    if (value === undefined) {
      return null;
    }
    nibbles.push(value);
  }

  if (nibbles.length % 2 === 1) {
    nibbles.unshift(0);
  }

  const bytes = Buffer.alloc(nibbles.length / 2);
  for (let i = 0; i < nibbles.length; i += 2) {
    const high = nibbles[i] ?? 0;
    const low = nibbles[i + 1] ?? 0;
    bytes[i / 2] = (high << 4) | low;
  }
  return bytes;
}

function decodeCustomBase64(text: string): Buffer {
  let bitBuffer = 0;
  let bitCount = 0;
  const out: number[] = [];

  for (const char of text) {
    const value = BASE64_LOOKUP.get(char);
    if (value === undefined) {
      throw new Error(`Unexpected character "${char}" in binary payload`);
    }
    bitBuffer = (bitBuffer << 6) | value;
    bitCount += 6;

    if (bitCount >= 8) {
      bitCount -= 8;
      out.push((bitBuffer >> bitCount) & 0xff);
      bitBuffer &= (1 << bitCount) - 1;
    }
  }

  return Buffer.from(out);
}

function trimTrailingNulls(text: string): string {
  let end = text.length;
  while (end > 0 && text.charCodeAt(end - 1) === 0) {
    end -= 1;
  }
  return text.slice(0, end);
}

export function parseBinarySection(binarySection: string): ParsedBinarySection {
  if (!binarySection || !binarySection.trim()) {
    throw new Error('Binary section content is empty');
  }

  const normalizedSection = trimTrailingNulls(binarySection.replace(/\r/g, ''));
  const lastColonIndex = normalizedSection.lastIndexOf(':');
  if (lastColonIndex === -1) {
    throw new Error('Unable to split binary header and payload');
  }

  const headerText = normalizedSection.slice(0, lastColonIndex);
  const payloadText = normalizedSection
    .slice(lastColonIndex + 1)
    .replace(/\s+/g, '');
  if (!payloadText) {
    throw new Error('Binary payload is empty');
  }

  const uncompressedMatch = headerText.match(/\$\$\$\$(\d+)/);
  const uncompressedSizeToken = uncompressedMatch?.[1];
  const declaredUncompressedSize = uncompressedSizeToken
    ? Number.parseInt(uncompressedSizeToken, 10)
    : undefined;

  const headerTokenArea = headerText.replace(/\$\$\$\$\d+/, '');
  const headerTokens = headerTokenArea
    .split(/[:\n]/)
    .map((token) => token.trim())
    .filter(Boolean);

  const headerFields: BinaryHeaderField[] = [];
  const undecodedTokens: string[] = [];
  const headerChunks: Buffer[] = [];

  for (const token of headerTokens) {
    const decoded = decodeNibbleToken(token);
    if (!decoded) {
      undecodedTokens.push(token);
      continue;
    }
    headerChunks.push(decoded);

    let decimalValue: number | undefined;
    try {
      if (decoded.length <= 6) {
        decimalValue = decoded.readUIntBE(0, decoded.length);
      } else if (decoded.length === 8) {
        decimalValue = Number(decoded.readBigUInt64BE());
      }
    } catch {
      decimalValue = undefined;
    }

    headerFields.push({
      token,
      bytes: decoded,
      decimalValue,
    });
  }

  const headerBytes = Buffer.concat(headerChunks);
  const payloadBytes = decodeCustomBase64(payloadText);
  const combinedBytes = Buffer.concat([headerBytes, payloadBytes]);

  return {
    declaredUncompressedSize,
    headerFields,
    undecodedTokens,
    headerBytes,
    payloadBytes,
    combinedBytes,
  };
}

function bufferToWordArray(
  buffer: Buffer,
  wordSize: 2 | 4,
  maxEntries?: number,
): number[] {
  const values: number[] = [];
  const limit = maxEntries ?? Number.POSITIVE_INFINITY;

  for (let offset = 0; offset + wordSize <= buffer.length; offset += wordSize) {
    if (wordSize === 2) {
      values.push(buffer.readUInt16LE(offset));
    } else {
      values.push(buffer.readUInt32LE(offset));
    }
    if (values.length >= limit) {
      break;
    }
  }

  return values;
}

function bufferToFloat32Array(buffer: Buffer, maxEntries?: number): number[] {
  const values: number[] = [];
  const limit = maxEntries ?? Number.POSITIVE_INFINITY;

  for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
    values.push(buffer.readFloatLE(offset));
    if (values.length >= limit) {
      break;
    }
  }

  return values;
}

function readableAscii(bytes: Buffer): string | undefined {
  if (!bytes.length) {
    return undefined;
  }
  return bytes.every((value) => value >= 32 && value <= 126)
    ? bytes.toString('ascii')
    : undefined;
}

export function binarySectionToJson(
  parsed: ParsedBinarySection,
  options: BinarySectionJsonOptions = {},
): BinarySectionJson {
  const { includePayloadEncodings = ['uint32'], maxPayloadEntries } = options;

  const header: Record<string, BinaryHeaderJson> = {};

  for (const field of parsed.headerFields) {
    const hex = field.bytes.toString('hex');
    let uintBE: number | undefined;
    let uintLE: number | undefined;
    let float32LE: number | undefined;
    let float32BE: number | undefined;
    const asciiText = readableAscii(field.bytes);

    if (field.bytes.length <= 6) {
      uintBE = field.bytes.readUIntBE(0, field.bytes.length);
      uintLE = field.bytes.readUIntLE(0, field.bytes.length);
    } else if (field.bytes.length === 8) {
      uintBE = Number(field.bytes.readBigUInt64BE());
      uintLE = Number(field.bytes.readBigUInt64LE());
    }

    if (field.bytes.length === 4) {
      float32LE = field.bytes.readFloatLE(0);
      float32BE = field.bytes.readFloatBE(0);
    }

    header[field.token] = {
      token: field.token,
      byteLength: field.bytes.length,
      hex,
      uintBE,
      uintLE,
      float32LE,
      float32BE,
      ...(asciiText ? { ascii: asciiText } : {}),
    };
  }

  const payload: BinaryPayloadJson = {
    byteLength: parsed.payloadBytes.length,
  };

  for (const encoding of includePayloadEncodings) {
    if (encoding === 'base64') {
      payload.base64 = parsed.payloadBytes.toString('base64');
    } else if (encoding === 'uint16') {
      payload.uint16LittleEndian = bufferToWordArray(
        parsed.payloadBytes,
        2,
        maxPayloadEntries,
      );
    } else if (encoding === 'uint32') {
      payload.uint32LittleEndian = bufferToWordArray(
        parsed.payloadBytes,
        4,
        maxPayloadEntries,
      );
    } else if (encoding === 'float32') {
      payload.float32LittleEndian = bufferToFloat32Array(
        parsed.payloadBytes,
        maxPayloadEntries,
      );
    }
  }

  return {
    declaredUncompressedSize: parsed.declaredUncompressedSize,
    header,
    undecodedTokens: parsed.undecodedTokens,
    payload,
  };
}
