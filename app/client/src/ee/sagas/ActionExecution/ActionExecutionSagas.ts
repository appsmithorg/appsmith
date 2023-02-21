export * from "ce/sagas/ActionExecution/ActionExecutionSagas";

import { getAppsmithConfigs } from "@appsmith/configs";
import { ActionDescription } from "@appsmith/workers/Evaluation/fns/index";
import {
  executeActionTriggers as CE_executeActionTriggers,
  TriggerMeta,
} from "ce/sagas/ActionExecution/ActionExecutionSagas";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { call } from "redux-saga/effects";
import {
  windowMessageListener,
  unListenWindowMessage,
} from "../WindowMessageListener/WindowMessageListenerSagas";

const { cloudHosting } = getAppsmithConfigs();

export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
): any {
  if (!cloudHosting) {
    switch (trigger.type) {
      case "WINDOW_MESSAGE_LISTENER":
        yield call(
          windowMessageListener,
          trigger.payload,
          eventType,
          triggerMeta,
        );
        return;
      case "UNLISTEN_WINDOW_MESSAGE":
        yield call(
          unListenWindowMessage,
          trigger.payload,
          eventType,
          triggerMeta,
        );
        return;
    }
  }
  return yield call(CE_executeActionTriggers, trigger, eventType, triggerMeta);
}
