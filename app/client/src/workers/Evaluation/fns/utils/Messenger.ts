/* eslint-disable no-console */
import { WorkerErrorTypes } from "ce/workers/common/types";
import { uniqueId } from "lodash";
import { MessageType, sendMessage } from "utils/MessageUtil";
type TPromiseResponse =
  | {
      data: any;
      error: null;
    }
  | {
      error: { message: string; errorBody: unknown };
      data: null;
    };

function responseHandler(requestId: string): Promise<TPromiseResponse> {
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

export class WorkerMessenger {
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

  static ping(payload: any) {
    sendMessage.call(self, {
      messageType: MessageType.DEFAULT,
      body: payload,
    });
  }

  static respond(messageId: string, data: unknown, timeTaken: number) {
    try {
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: { data, timeTaken },
      });
    } catch (e) {
      console.error(e);
      sendMessage.call(self, {
        messageId,
        messageType: MessageType.RESPONSE,
        body: {
          timeTaken: timeTaken.toFixed(2),
          data: {
            errors: [
              {
                type: WorkerErrorTypes.CLONE_ERROR,
                message: (e as Error)?.message,
                context: JSON.stringify(data),
              },
            ],
          },
        },
      });
    }
  }
}
