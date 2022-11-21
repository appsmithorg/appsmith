import noop from "lodash/noop";
import { EVAL_WORKER_ACTIONS } from "utils/DynamicBindingUtils";
import { EvalWorkerRequest } from "../types";
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

const handlerMap: Record<
  EVAL_WORKER_ACTIONS,
  (req: EvalWorkerRequest) => any
> = {
  [EVAL_WORKER_ACTIONS.EVAL_ACTION_BINDINGS]: evalActionBindings,
  [EVAL_WORKER_ACTIONS.EVAL_TREE]: evalTree,
  [EVAL_WORKER_ACTIONS.EVAL_TRIGGER]: evalTrigger,
  [EVAL_WORKER_ACTIONS.EXECUTE_SYNC_JS]: executeSyncJS,
  [EVAL_WORKER_ACTIONS.EVAL_EXPRESSION]: evalExpression,
  [EVAL_WORKER_ACTIONS.UNDO]: undo,
  [EVAL_WORKER_ACTIONS.REDO]: redo,
  [EVAL_WORKER_ACTIONS.UPDATE_REPLAY_OBJECT]: updateReplayObject,
  [EVAL_WORKER_ACTIONS.VALIDATE_PROPERTY]: validateProperty,
  [EVAL_WORKER_ACTIONS.INSTALL_LIBRARY]: installLibrary,
  [EVAL_WORKER_ACTIONS.UNINSTALL_LIBRARY]: uninstallLibrary,
  [EVAL_WORKER_ACTIONS.LOAD_LIBRARIES]: loadLibraries,
  [EVAL_WORKER_ACTIONS.PROCESS_TRIGGER]: noop,
  [EVAL_WORKER_ACTIONS.LINT_TREE]: noop,
  [EVAL_WORKER_ACTIONS.SETUP]: setupEvaluationEnvironment,
  [EVAL_WORKER_ACTIONS.CLEAR_CACHE]: clearCache,
  [EVAL_WORKER_ACTIONS.SET_EVALUATION_VERSION]: setEvaluationVersion,
  [EVAL_WORKER_ACTIONS.INIT_FORM_EVAL]: initFormEval,
};

export default handlerMap;
