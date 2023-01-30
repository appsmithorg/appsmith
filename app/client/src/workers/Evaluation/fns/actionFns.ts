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
    },
  };
}

export type TRunArgs = Parameters<typeof runFnDescriptor>;
export type TRunDescription = ReturnType<typeof runFnDescriptor>;

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
    type: "CLEAR_PLUGIN_ACTION" as const,
    payload: {
      actionId: this.actionId,
    },
  };
}

export type TClearArgs = Parameters<typeof clearFnDescriptor>;
export type TClearDescription = ReturnType<typeof clearFnDescriptor>;

export async function clear(this: any) {
  return promisify(clearFnDescriptor.bind(this))();
}
