import { Logger } from 'tslog'
export const log = new Logger({ 
    prettyLogTemplate: "{{logLevelName}} ", 
    // prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}} {{logLevelName}} ", 
});
