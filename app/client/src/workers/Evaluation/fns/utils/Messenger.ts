/* eslint-disable no-console */
import { WorkerErrorTypes } from "ce/workers/common/types";
import { uniqueId } from "lodash";
import { MessageType, sendMessage } from "utils/MessageUtil";
import { getOriginalValueFromProxy } from "workers/Evaluation/JSObject/Collection";
import { evaluateAsync } from "workers/Evaluation/evaluate";
type TPromiseResponse =
  | {
      data: any;
      error: null;
    }
  | {
      error: { message: string; errorBody: unknown };
      data: null;
    };

type AsyncEvalResponse = Awaited<ReturnType<typeof evaluateAsync>>;

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

/**
 * Convert proxy data to target object
 * @param data
 * @returns
 */
function sanitizeData(data: unknown) {
  const responseData = data;
  if (typeof data === "object" && (responseData as AsyncEvalResponse).result) {
    (responseData as AsyncEvalResponse).result = getOriginalValueFromProxy(
      (data as AsyncEvalResponse).result,
    );
  }
  return responseData;
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
        body: { data: sanitizeData(data), timeTaken },
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
