export * from "ce/sagas/ActionExecution/ActionExecutionSagas";

import { getAppsmithConfigs } from "@appsmith/configs";
import type { ActionDescription } from "@appsmith/workers/Evaluation/fns/index";
import type { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import { executeActionTriggers as CE_executeActionTriggers } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
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
        yield call(windowMessageListener);
        return;
      case "UNLISTEN_WINDOW_MESSAGE":
        yield call(unListenWindowMessage);
        return;
    }
  }
  return yield call(CE_executeActionTriggers, trigger, eventType, triggerMeta);
}
