import { LINT_WORKER_ACTIONS } from "Linting/types";
import { updateJSLibraryGlobals } from "./updateJSLibraryGlobals";
import { lintTree } from "./lintTree";

export const handlerMap = {
  [LINT_WORKER_ACTIONS.LINT_TREE]: lintTree,
  [LINT_WORKER_ACTIONS.UPDATE_LINT_GLOBALS]: updateJSLibraryGlobals,
} as const;
