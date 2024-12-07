import type { ActionResponse } from "api/ActionAPI";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import { isString } from "lodash";

export function parseActionResponse(actionResponse?: ActionResponse) {
  let response: Array<Record<string, unknown>> | string = "";
  let errorMessage = "";
  let hintMessages: Array<string> = [];

  if (actionResponse) {
    if (!actionResponse.isExecutionSuccess) {
      errorMessage = actionResponse.readableError
        ? getErrorAsString(actionResponse.readableError)
        : getErrorAsString(actionResponse.body);
    } else if (isString(actionResponse.body)) {
      errorMessage = "";
      try {
        response = JSON.parse(actionResponse.body);
      } catch (e) {
        response = [{ response: actionResponse.body }];
      }
    } else {
      errorMessage = "";
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response = actionResponse.body as any;
    }

    if (actionResponse.messages && actionResponse.messages.length) {
      errorMessage = "";
      hintMessages = actionResponse.messages;
    }
  }

  return { response, errorMessage, hintMessages };
}
