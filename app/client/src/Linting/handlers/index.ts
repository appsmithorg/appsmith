import { LINT_WORKER_ACTIONS } from "Linting/types";
import { lintTree } from "./lintTree";
import { updateJSLibraryGlobals } from "./updateJSLibraryGlobals";

export const handlerMap = {
  [LINT_WORKER_ACTIONS.LINT_TREE]: lintTree,
  [LINT_WORKER_ACTIONS.UPDATE_LINT_GLOBALS]: updateJSLibraryGlobals,
} as const;
