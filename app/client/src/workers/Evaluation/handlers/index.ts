import { result } from "lodash";
import noop from "lodash/noop";
import {
  EVAL_WORKER_ACTIONS,
  EVAL_WORKER_ASYNC_ACTION,
  EVAL_WORKER_SYNC_ACTION,
} from "workers/Evaluation/evalWorkerActions";
import { createEvaluationContext } from "../evaluate";
import { EvalWorkerSyncRequest, EvalWorkerASyncRequest } from "../types";
import evalActionBindings from "./evalActionBindings";
import evalExpression from "./evalExpression";
import evalTree, { clearCache, dataTreeEvaluator } from "./evalTree";
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
  [EVAL_WORKER_ACTIONS.DEBUG]: debug,
};

async function debug(request: any) {
  const { data } = request;
  const { code, localVariables } = data;

  const dataTree = dataTreeEvaluator?.evalTree || {};
  const resolvedFunctions = dataTreeEvaluator?.resolvedFunctions || {};

  const _ctx = createEvaluationContext({
    dataTree,
    resolvedFunctions,
    isTriggerBased: true,
  });
  self.ALLOW_ASYNC = true;
  let debugCode = code
    .split("\n")
    .map((line: string, idx: number) => {
      return `${line}
      localVariables.forEach((variable) => {
        debugger;
        try {
          temp=eval(variable)
        } catch(e) {
          temp = null;
        }
        localValues[variable] = temp;
      })
    _sleep(_ctx, ${idx + 1}, localValues)`;
    })
    .join("\n");
  debugCode = `(async function() { const localValues = {}; const _l=localVariables; let temp; _l.forEach((variable) => {
    localValues[variable] = undefined;
  });
  _sleep(_ctx, 0, localValues);
  ${debugCode} })()`;

  Object.assign(self, _ctx);
  let result;
  try {
    debugger;
    result = await eval(debugCode);
  } catch (e) {
    console.log(e);
  }
  return result;
}

export { syncHandlerMap, asyncHandlerMap };
