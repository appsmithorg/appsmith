import {
  ERROR_0,
  ERROR_401,
  ERROR_403,
  ERROR_500,
  createMessage,
} from "@workflowProxy/constants/messages";
import type { ApiResponse } from "@workflowProxy/constants/types";
import type { google } from "@temporalio/proto";
import { Connection } from "@temporalio/client";
import { customAlphabet } from "nanoid";

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

/**
 * This function finds the datatype of the given value.
 * typeof, lodash and others will return false positives for things like array, wrapper objects, etc
 * @param value
 * @returns datatype of the received value as string
 */
export const findDatatype = (value: unknown) => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

/**
 * This function converts the google.protobuf.Timestamp to Date
 * @param timestamp
 * @returns Date
 */
export function timestampToDate(timestamp: google.protobuf.ITimestamp): Date {
  return new Date(
    timestamp.seconds.toNumber() * 1000 + timestamp.nanos / 1000000,
  );
}

export function generateWorkflowRunId(): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const length = 8;
  const nanoid = customAlphabet(alphabet, length);
  return nanoid(); // eg."HV2C5NPU"
}

// Connections are expensive to construct and should be reused.
// Make sure to close any unused connections to avoid leaking resources.
export class ConnectionSingleton {
  private static instance: Connection;

  private constructor() {}

  public static async getInstance(): Promise<Connection> {
    if (!ConnectionSingleton.instance) {
      // Connect to the default Server location

      ConnectionSingleton.instance = await Connection.connect({
        address: "localhost:7233",
      });
    }
    return ConnectionSingleton.instance;
  }
}
