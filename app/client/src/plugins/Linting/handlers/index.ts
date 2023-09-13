import { LINT_WORKER_ACTIONS } from "plugins/Linting/types";
import { updateJSLibraryGlobals } from "./updateJSLibraryGlobals";
import { lintService } from "./lintService";
import { setupLintingWorkerEnv } from "./setupLinkingWorkerEnv";

export const handlerMap = {
  [LINT_WORKER_ACTIONS.LINT_TREE]: lintService.lintTree,
  [LINT_WORKER_ACTIONS.UPDATE_LINT_GLOBALS]: updateJSLibraryGlobals,
  [LINT_WORKER_ACTIONS.SETUP]: setupLintingWorkerEnv,
} as const;
