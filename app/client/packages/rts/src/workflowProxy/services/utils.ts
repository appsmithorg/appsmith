import {
  ERROR_0,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  createMessage,
} from "@workflowProxy/constants/messages";
import type { ApiResponse } from "@workflowProxy/constants/types";

export const axiosConnectionAbortedCode = "ECONNABORTED";
/**
 * validates if response does have any errors
 * @throws {Error}
 * @param response
 * @param show
 * @param logToSentry
 */
export function* validateResponse(response: ApiResponse | any) {
  if (!response) {
    throw Error("");
  }

  // letting `apiFailureResponseInterceptor` handle it this case
  if (response?.code === axiosConnectionAbortedCode) {
    return false;
  }

  if (!response.responseMeta && !response.status) {
    throw Error(getErrorMessage(0));
  }

  if (!response.responseMeta && response.status) {
    throw Error(getErrorMessage(response.status));
  }

  if (response.responseMeta.success) {
    return true;
  }
  throw Error(response.responseMeta.error.message);
}

/**
 * transform server errors to client error codes
 *
 * @param code
 * @param resourceType
 */
const getErrorMessage = (code: number) => {
  switch (code) {
    case 401:
      return createMessage(ERROR_401);
    case 500:
      return createMessage(ERROR_500);
    case 403:
      return createMessage(() => ERROR_403("", ""));
    case 0:
      return createMessage(ERROR_0);
  }
};
