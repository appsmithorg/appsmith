/* eslint-disable no-console */
import { WorkerErrorTypes } from "ee/workers/common/types";
import { uniqueId } from "lodash";
import { MessageType, sendMessage } from "utils/MessageUtil";
import { getErrorMessage } from "workers/Evaluation/errorModifier";
type TPromiseResponse =
  | {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any;
      error: null;
    }
  | {
      error: { message: string; errorBody: unknown };
      data: null;
    };

async function responseHandler(requestId: string): Promise<TPromiseResponse> {
  return new Promise((resolve) => {
    const listener = (event: MessageEvent) => {
      const { body, messageId, messageType } = event.data;
      if (messageId === requestId && messageType === MessageType.RESPONSE) {
        resolve(body.data);
        self.removeEventListener("message", listener);
      }
    };
    self.addEventListener("message", listener);
  });
}

export type TransmissionErrorHandler = (
  messageId: string,
  startTime: number,
  endTime: number,
  responseData: unknown,
  e: unknown,
) => void;

const defaultErrorHandler: TransmissionErrorHandler = (
  messageId: string,
  startTime: number,
  endTime: number,
  responseData: unknown,
  e: unknown,
) => {
  console.error(e);
  sendMessage.call(self, {
    messageId,
    messageType: MessageType.RESPONSE,
    body: {
      startTime,
      endTime,
      data: {
        errors: [
          {
            type: WorkerErrorTypes.CLONE_ERROR,
            message: (e as Error)?.message,
            errorMessage: getErrorMessage(
              e as Error,
              WorkerErrorTypes.CLONE_ERROR,
            ),
            context: JSON.stringify(responseData),
          },
        ],
      },
    },
  });
};

export class WorkerMessenger {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async request(payload: any) {
    const messageId = uniqueId(`request-${payload.method}-`);
    sendMessage.call(self, {
      messageId,
      messageType: MessageType.REQUEST,
      body: payload,
    });
    const response = await responseHandler(messageId);
    return response;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ping(payload: any) {
    try {
      sendMessage.call(self, {
        messageType: MessageType.DEFAULT,
        body: payload,
      });
    } catch (e) {
      // TODO: Pass in a error handler to allow custom error handling.
      console.error(e);
      sendMessage.call(self, {
        messageType: MessageType.DEFAULT,
        body: {
          data: {
            errors: [
              {
                type: WorkerErrorTypes.CLONE_ERROR,
                message: (e as Error)?.message,
              },
            ],
          },
        },
      });
    }
  }

  static respond(
    messageId: string,
    data: unknown,
    startTime: number,
    endTime: number,
    onErrorHandler?: TransmissionErrorHandler,
  ) {
    try {
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: { data, startTime, endTime },
      });
    } catch (e) {
      const errorHandler = onErrorHandler || defaultErrorHandler;
      try {
        errorHandler(messageId, startTime, endTime, data, e);
      } catch {
        defaultErrorHandler(messageId, startTime, endTime, data, e);
      }
    }
  }
}
