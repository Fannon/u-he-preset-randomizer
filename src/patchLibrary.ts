const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const fg = require("fast-glob");
import { SynthName } from "./config";
import { Patch, parseUhePatch, serializePatchToFile } from "./parser";
import { log } from "./utils/log";

export interface PatchLibrary {
  patchRootFolder: string;
  patches: Patch[];
}

export function loadPatchLibrary(synthName: SynthName): PatchLibrary {
  const presetFolder = path.join(
    os.homedir(),
    `/Documents/u-he/${synthName}.data/Presets/${synthName}`
  );

  const patchLibrary: PatchLibrary = {
    patchRootFolder: presetFolder,
    patches: [],
  };

  const presets = fg.sync(["**/*.h2p"], { cwd: presetFolder });

  if (presets.length === 0) {
    log.error('No patches found: ' + presetFolder)
    process.exit(1)
  }

  for (const presetPath of presets) {
    const presetString = fs
      .readFileSync(path.join(presetFolder, presetPath))
      .toString();
    patchLibrary.patches.push(parseUhePatch(presetString, presetPath));
  }

  log.info(`Found and loaded ${presets.length} ${synthName} presets`);

  return patchLibrary;
}

export function writePatchLibrary(patchLibrary: PatchLibrary) {
  log.info(`Writing Patch Library with ${patchLibrary.patches.length} patches to ${patchLibrary.patchRootFolder}`)

  for (const patch of patchLibrary.patches) {
    const filePath = path.join(patchLibrary.patchRootFolder, patch.filePath)
    const fileContent = serializePatchToFile(patch)
    fs.outputFileSync(filePath, fileContent)
    log.info(`Written patch: "${filePath}"`)
  }
}
