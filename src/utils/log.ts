import { Logger } from 'tslog'
export const log = new Logger({ 
    prettyLogTemplate: "{{hh}}:{{MM}}:{{ss}} {{logLevelName}} ", 
});
