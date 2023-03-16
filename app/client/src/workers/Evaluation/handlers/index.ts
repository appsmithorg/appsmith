import noop from "lodash/noop";
import type {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "@appsmith/workers/Evaluation/evalWorkerActions";
import { EVAL_WORKER_ACTIONS } from "@appsmith/workers/Evaluation/evalWorkerActions";
import type { EvalWorkerSyncRequest, EvalWorkerASyncRequest } from "../types";
import evalActionBindings from "./evalActionBindings";
import evalExpression from "./evalExpression";
import evalTree, { clearCache } from "./evalTree";
import evalTrigger from "./evalTrigger";
import executeSyncJS from "./executeSyncJS";
import initFormEval from "./initFormEval";
import { installLibrary, loadLibraries, uninstallLibrary } from "./jsLibrary";
import { redo, undo, updateReplayObject } from "./replay";
import setupEvaluationEnvironment, {
  setEvaluationVersion,
} from "./setupEvalEnv";
import validateProperty from "./validateProperty";

const syncHandlerMap: Record<
  EVAL_WORKER_SYNC_ACTION,
  (req: EvalWorkerSyncRequest) => any
> = {
  [EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS]: evalActionBindings,
  [EVAL_WORKER_ACTIONS.EVAL_TREE]: evalTree,
  [EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS]: executeSyncJS,
  [EVAL_WORKER_ACTIONS.UNDO]: undo,
  [EVAL_WORKER_ACTIONS.REDO]: redo,
  [EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT]: updateReplayObject,
  [EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY]: validateProperty,
  [EVAL_WORKER_ACTIONS.INSTALL_LIBRARY]: installLibrary,
  [EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY]: uninstallLibrary,
  [EVAL_WORKER_ACTIONS.LOAD_LIBRARIES]: loadLibraries,
  [EVAL_WORKER_ACTIONS.LINT_TREE]: noop,
  [EVAL_WORKER_ACTIONS.SETUP]: setupEvaluationEnvironment,
  [EVAL_WORKER_ACTIONS.CLEAR_CACHE]: clearCache,
  [EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION]: setEvaluationVersion,
  [EVAL_WORKER_ACTIONS.INIT_FORM_EVAL]: initFormEval,
};

const asyncHandlerMap: Record<
  EVAL_WORKER_ASYNC_ACTION,
  (req: EvalWorkerASyncRequest) => any
> = {
  [EVAL_WORKER_ACTIONS.EVAL_TRIGGER]: evalTrigger,
  [EVAL_WORKER_ACTIONS.EVAL_EXPRESSION]: evalExpression,
};

export { syncHandlerMap, asyncHandlerMap };
