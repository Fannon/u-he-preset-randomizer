import { analyzeParamsTypeAndRange } from "./analyzer";
import { loadPatchLibrary, writePatchLibrary } from "./patchLibrary";
import * as fs from "fs-extra";
import { log } from "./utils/log";
import { getConfig } from "./config";
import { createFullyRandomPatches } from "./randomizer";
import * as packageJson from "../package.json"

log.info('======================================================================')
log.info('u-he Patch Randomizer CLI v' + packageJson.version)
log.info('======================================================================')

const config = getConfig();

const patchLibrary = loadPatchLibrary(config.synthName)

if (config.debug) {
  fs.outputFileSync(
    "./patchLibrary.json",
    JSON.stringify(patchLibrary, null, 2)
  );
}

const paramsModel = analyzeParamsTypeAndRange(patchLibrary)

if (config.debug) {
  fs.outputFileSync(
    "./paramsModel.json",
    JSON.stringify(paramsModel, null, 2)
  );
}

const generatedPatches = createFullyRandomPatches(patchLibrary, paramsModel, config.amount)

writePatchLibrary(generatedPatches)
