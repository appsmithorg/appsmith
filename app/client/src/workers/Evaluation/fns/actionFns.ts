import { isTrueObject } from "ee/workers/Evaluation/evaluationUtils";
import { promisify } from "./utils/Promisify";
import type { ActionEntity } from "ee/entities/DataTree/types";

function runFnDescriptor(
  this: ActionEntity,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  this: ActionEntity,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccessOrParams?: (data: any) => unknown | Record<string, unknown>,
  onError?: (e: string) => unknown,
  params = {},
) {
  const executor = promisify(runFnDescriptor.bind(this));

  try {
    const response = await executor(onSuccessOrParams, onError, params);
    // response is an array of [data, params, responseMeta]
    // @ts-expect-error: self type is not defined
    const action = self[this.name] as ActionEntity;

    if (action) {
      action.data = response[0];
      action.responseMeta = response[2];
      action.isLoading = false;
    }

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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError((e as any).message);

      return;
    }

    throw e;
  }
}

function clearFnDescriptor(this: ActionEntity) {
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

export async function clear(this: ActionEntity) {
  return promisify(clearFnDescriptor.bind(this))();
}
