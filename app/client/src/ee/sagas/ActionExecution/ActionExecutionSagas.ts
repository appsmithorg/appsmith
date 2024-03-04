export * from "ce/sagas/ActionExecution/ActionExecutionSagas";

import type { ActionDescription } from "@appsmith/workers/Evaluation/fns/index";
import type { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import { executeActionTriggers as CE_executeActionTriggers } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { call } from "redux-saga/effects";
import {
  windowMessageListener,
  unListenWindowMessage,
} from "../WindowMessageListener/WindowMessageListenerSagas";

import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isWindowMessageListenerEnabled } from "@appsmith/utils/planHelpers";
import store from "store";
import { handleAssignRequestOnBrowserRun } from "../workflowsActionSagas";

export function* executeActionTriggers(
  trigger: ActionDescription,
  eventType: EventType,
  triggerMeta: TriggerMeta,
): any {
  let isWindowListenerEnabled = true;
  if (store) {
    const featureFlags = selectFeatureFlags(store?.getState());
    isWindowListenerEnabled = isWindowMessageListenerEnabled(featureFlags);
  }

  if (isWindowListenerEnabled) {
    switch (trigger.type) {
      case "WINDOW_MESSAGE_LISTENER":
        yield call(windowMessageListener);
        return;
      case "UNLISTEN_WINDOW_MESSAGE":
        yield call(unListenWindowMessage);
        return;
    }
  }

  switch (trigger.type) {
    case "ASSIGN_REQUEST":
      const response = yield call(handleAssignRequestOnBrowserRun, trigger);
      return response;
  }
  return yield call(CE_executeActionTriggers, trigger, eventType, triggerMeta);
}
