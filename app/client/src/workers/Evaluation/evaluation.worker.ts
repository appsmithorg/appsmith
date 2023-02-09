// Workers do not have access to log.error
/* eslint-disable no-console */
import { WorkerErrorTypes } from "@appsmith/workers/common/types";
import { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";
import { TMessage, sendMessage, MessageType } from "utils/MessageUtil";

//TODO: Create a more complete RPC setup in the subtree-eval branch.
function syncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerSyncRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const startTime = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;
  const messageHandler = syncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const responseData = messageHandler(body);
  if (!responseData) return;
  const endTime = performance.now();
  respond(messageId, responseData, endTime - startTime);
}

async function asyncRequestMessageListener(
  e: MessageEvent<TMessage<EvalWorkerASyncRequest>>,
) {
  const { messageType } = e.data;
  if (messageType !== MessageType.REQUEST) return;
  const start = performance.now();
  const { body, messageId } = e.data;
  const { method } = body;
  if (!method) return;
  const messageHandler = asyncHandlerMap[method];
  if (typeof messageHandler !== "function") return;
  const data = await messageHandler(body);
  if (!data) return;
  const end = performance.now();
  respond(messageId, data, end - start);
}

function respond(messageId: string, data: unknown, timeTaken: number) {
  try {
    const __data = JSON.parse(JSON.stringify(data));
    sendMessage.call(self, {
      messageId,
      messageType: MessageType.RESPONSE,
      body: { data: __data, timeTaken },
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

self.addEventListener("message", syncRequestMessageListener);
self.addEventListener("message", asyncRequestMessageListener);
