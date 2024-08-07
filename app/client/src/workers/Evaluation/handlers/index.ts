import noop from "lodash/noop";
import type {
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "ee/workers/Evaluation/evalWorkerActions";
import { EVAL_WORKER_ACTIONS } from "ee/workers/Evaluation/evalWorkerActions";
import type { EvalWorkerSyncRequest, EvalWorkerASyncRequest } from "../types";
import evalActionBindings from "./evalActionBindings";
import evalExpression from "./evalExpression";
import {
  evalTree,
  clearCache,
  evalTreeTransmissionErrorHandler,
} from "./evalTree";
import evalTrigger from "./evalTrigger";
import initFormEval from "./initFormEval";
import { installLibrary, loadLibraries, uninstallLibrary } from "./jsLibrary";
import { redo, undo, updateReplayObject } from "./replay";
import setupEvaluationEnvironment, {
  setEvaluationVersion,
} from "./setupEvalEnv";
import validateProperty from "./validateProperty";
import updateActionData from "./updateActionData";
import type { TransmissionErrorHandler } from "../fns/utils/Messenger";
import { evalTreeWithChanges } from "../evalTreeWithChanges";

const syncHandlerMap: Record<
  EVAL_WORKER_SYNC_ACTION,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req: EvalWorkerSyncRequest) => any
> = {
  [EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS]: evalActionBindings,
  [EVAL_WORKER_ACTIONS.EVAL_TREE]: evalTree,
  [EVAL_WORKER_ACTIONS.EVAL_TREE_WITH_CHANGES]: evalTreeWithChanges,
  [EVAL_WORKER_ACTIONS.UNDO]: undo,
  [EVAL_WORKER_ACTIONS.REDO]: redo,
  [EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT]: updateReplayObject,
  [EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY]: validateProperty,
  [EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY]: uninstallLibrary,
  [EVAL_WORKER_ACTIONS.LINT_TREE]: noop,
  [EVAL_WORKER_ACTIONS.SETUP]: setupEvaluationEnvironment,
  [EVAL_WORKER_ACTIONS.CLEAR_CACHE]: clearCache,
  [EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION]: setEvaluationVersion,
  [EVAL_WORKER_ACTIONS.INIT_FORM_EVAL]: initFormEval,
  [EVAL_WORKER_ACTIONS.UPDATE_ACTION_DATA]: updateActionData,
};

const asyncHandlerMap: Record<
  EVAL_WORKER_ASYNC_ACTION,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req: EvalWorkerASyncRequest) => any
> = {
  [EVAL_WORKER_ACTIONS.EVAL_TRIGGER]: evalTrigger,
  [EVAL_WORKER_ACTIONS.EVAL_EXPRESSION]: evalExpression,
  [EVAL_WORKER_ACTIONS.LOAD_LIBRARIES]: loadLibraries,
  [EVAL_WORKER_ACTIONS.INSTALL_LIBRARY]: installLibrary,
};

const transmissionErrorHandlerMap: Partial<
  Record<
    EVAL_WORKER_SYNC_ACTION | EVAL_WORKER_ASYNC_ACTION,
    TransmissionErrorHandler
  >
> = {
  [EVAL_WORKER_ACTIONS.EVAL_TREE]: evalTreeTransmissionErrorHandler,
};

export { syncHandlerMap, asyncHandlerMap, transmissionErrorHandlerMap };
