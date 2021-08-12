import Liftoff = require("liftoff");
import * as ora from "ora";

export {
    ActionConfig,
    ActionType,
    AddActionConfig,
    AddManyActionConfig,
    AppendActionConfig,
    CustomActionFunction,
    ModifyActionConfig,
    PlopCfg,
    PlopGenerator,
    NodePlopAPI
} from 'node-plop';

export const Plop: Liftoff;
export const run: (env: Liftoff.LiftoffEnv, _: any, passArgsBeforeDashes: boolean) => void;
export const progressSpinner: ora.Ora;
