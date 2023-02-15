// Workers do not have access to log.error
/* eslint-disable no-console */
import { WorkerErrorTypes } from "@appsmith/workers/common/types";
import { EvalWorkerASyncRequest, EvalWorkerSyncRequest } from "./types";
import { syncHandlerMap, asyncHandlerMap } from "./handlers";
import { TMessage, sendMessage, MessageType } from "utils/MessageUtil";
import { evaluateAsync } from "./evaluate";
import { getOriginalValueFromProxy } from "./JSObject/Collection";

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

type AsyncEvalResponse = Awaited<ReturnType<typeof evaluateAsync>>;
type Data = AsyncEvalResponse | unknown;

function respond(messageId: string, data: Data, timeTaken: number) {
  try {
    const responseData = data;
    if (typeof data === "object" && "result" in (data as AsyncEvalResponse)) {
      // @ts-expect-error: need to fix type
      responseData.result = getOriginalValueFromProxy(data.result);
    }
    sendMessage.call(self, {
      messageId,
      messageType: MessageType.RESPONSE,
      body: { data: responseData, timeTaken },
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
