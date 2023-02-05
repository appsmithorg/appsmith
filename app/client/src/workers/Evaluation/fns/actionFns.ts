import { isTrueObject } from "ce/workers/Evaluation/evaluationUtils";
import { promisify } from "./utils/Promisify";

function runFnDescriptor(
  this: any,
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: (e: string) => unknown,
  params = {},
) {
  const type = "RUN_PLUGIN_ACTION" as const;
  const actionParams = isTrueObject(onSuccessOrParams)
    ? onSuccessOrParams
    : params;
  return {
    type,
    payload: {
      actionId: this.actionId,
      params: actionParams,
      onSuccess:
        typeof onSuccessOrParams === "function"
          ? onSuccessOrParams.toString()
          : undefined,
      onError: typeof onError === "function" ? onError.toString() : undefined,
    },
  };
}

export type TRunArgs = Parameters<typeof runFnDescriptor>;
export type TRunDescription = ReturnType<typeof runFnDescriptor>;
export type TRunActionType = TRunDescription["type"];

export default async function run(
  this: any,
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: (e: string) => unknown,
  params = {},
) {
  const executor = promisify(runFnDescriptor.bind(this));
  try {
    const response = await executor(onSuccessOrParams, onError, params);
    if (typeof onSuccessOrParams === "function") {
      onSuccessOrParams.apply(this, response);
      return;
    }
    /*
     * Api execution returns [response, params]
     * Old callback style are passed both response and params
     * Promise implementation somehow only passes response to the then callback.
     * */
    return response[0];
  } catch (e) {
    if (typeof onError === "function") {
      onError((e as any).message);
      return;
    }
    throw e;
  }
}

function clearFnDescriptor(this: any) {
  return {
    type: "CLEAR_PLUGIN_ACTION" as const,
    payload: {
      actionId: this.actionId,
    },
  };
}

export type TClearArgs = Parameters<typeof clearFnDescriptor>;
export type TClearDescription = ReturnType<typeof clearFnDescriptor>;
export type TClearActionType = TClearDescription["type"];

export async function clear(this: any) {
  return promisify(clearFnDescriptor.bind(this))();
}
