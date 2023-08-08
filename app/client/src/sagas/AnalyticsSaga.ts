import {
  ReduxActionTypes,
  type ReduxActionType,
} from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  RequestPayloadAnalyticsPath,
  cleanValuesInObjectForHashing,
  generateHashFromString,
} from "./helper";
import get from "lodash/get";
import log from "loglevel";

export function* sendAnalyticsEventSaga(
  type: ReduxActionType,
  payload: unknown,
) {
  try {
    switch (type) {
      case ReduxActionTypes.UPDATE_ACTION_INIT:
        const { action, pageName } = payload as {
          action: Action;
          pageName: string;
        };
        const cleanActionConfiguration = cleanValuesInObjectForHashing(
          action.actionConfiguration,
        );
        const actionConfigurationHash: string = yield generateHashFromString(
          JSON.stringify(cleanActionConfiguration),
        );

        const originalActionId = get(
          action,
          `${RequestPayloadAnalyticsPath}.originalActionId`,
          action.id,
        );

        AnalyticsUtil.logEvent("SAVE_ACTION", {
          actionName: action.name,
          pageName: pageName,
          originalActionId: originalActionId,
          actionId: action.id,
          hash: actionConfigurationHash,
          actionType: action.pluginType,
          actionPlugin: action.pluginId,
        });
    }
  } catch (e) {
    log.error("Failed to send analytics event");
  }
}
