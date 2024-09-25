import type { ActionResponse } from "api/ActionAPI";

function hasFailed(actionResponse: ActionResponse) {
  return actionResponse.statusCode
    ? actionResponse.statusCode[0] !== "2"
    : false;
}

export default hasFailed;
