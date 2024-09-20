import type { TMessage } from "utils/MessageUtil";
import { MessageType } from "utils/MessageUtil";
import { WorkerMessenger } from "workers/Evaluation/fns/utils/Messenger";
import type {
  LintRequest,
  LintTreeRequestPayload,
  updateJSLibraryProps,
} from "../types";
import { handlerMap } from "../handlers";
import type { FeatureFlags } from "ee/entities/FeatureFlag";

// The messageListener can have either of these three types
type LinterFunctionPayload = LintTreeRequestPayload &
  FeatureFlags &
  updateJSLibraryProps;

export function messageListener(
  e: MessageEvent<TMessage<LintRequest<LinterFunctionPayload>>>,
) {
  const { messageType } = e.data;

  if (messageType !== MessageType.REQUEST) return;

  const startTime = Date.now();
  const { body, messageId } = e.data;
  const { method } = body;

  if (!method) return;

  const messageHandler = handlerMap[method];

  if (typeof messageHandler !== "function") return;

  const responseData = messageHandler(body);

  if (!responseData) return;

  const endTime = Date.now();

  WorkerMessenger.respond(messageId, responseData, startTime, endTime);
}

self.onmessage = messageListener;
