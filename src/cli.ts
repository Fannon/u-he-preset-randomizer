import { Logger } from "tslog";

const log = new Logger({
  prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}} {{logLevelName}} ",
});

log.info('It works')