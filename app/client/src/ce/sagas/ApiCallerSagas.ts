import ActionAPI from "api/ActionAPI";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";

/**
 * DO NOT ADD any additional code/functionality in this saga. This function is overridden in EE to
 * use a different API for update action under the package editor.
 * The purpose of this saga is only to call the appropriate API and return the result
 * @param action Action
 * @returns Action
 */
export function* updateActionAPICall(action: Action) {
  try {
    const response: ApiResponse<Action> = yield ActionAPI.updateAction(action);

    return response;
  } catch (e) {
    throw e;
  }
}
