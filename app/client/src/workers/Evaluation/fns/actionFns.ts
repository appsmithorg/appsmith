import { isTrueObject } from "ce/workers/Evaluation/evaluationUtils";
import { promisify } from "./utils/Promisify";

function runFnDescriptor(
  this: any,
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: (e: string) => unknown,
  params = {},
) {
  const actionParams = isTrueObject(onSuccessOrParams)
    ? onSuccessOrParams
    : params;
  return {
    type: "RUN_PLUGIN_ACTION",
    payload: {
      actionId: this.actionId,
      params: actionParams,
    },
  };
}

export default async function run(
  this: any,
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: (e: string) => unknown,
  params = {},
) {
  const executor = promisify(runFnDescriptor.bind(this));
  let response;
  try {
    response = await executor(onSuccessOrParams, onError, params);
    if (typeof onSuccessOrParams === "function") {
      onSuccessOrParams(response);
      return;
    }
  } catch (e) {
    if (typeof onError === "function") {
      onError((e as Error).message);
      return;
    }
    throw e;
  }
  return response;
}

function clearFnDescriptor(this: any) {
  return {
    type: "CLEAR_PLUGIN_ACTION",
    payload: {
      actionId: this.actionId,
    },
  };
}

export async function clear(this: any) {
  return promisify(clearFnDescriptor.bind(this))();
}
