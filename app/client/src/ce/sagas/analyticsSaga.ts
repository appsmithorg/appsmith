import { getCurrentUser } from "selectors/usersSelectors";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { call, select } from "redux-saga/effects";
import type { APP_MODE } from "entities/App";
import {
  getCurrentApplication,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray } from "lodash";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { getAppMode } from "@appsmith/selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import { getWidget } from "sagas/selectors";
import { getUserSource } from "@appsmith/utils/AnalyticsUtil";

export interface UserAndAppDetails {
  pageId: string;
  appId: string;
  appMode: APP_MODE | undefined;
  appName: string;
  isExampleApp: boolean;
  userId: string;
  email: string;
  source: string;
  instanceId: string;
}

export function* getUserAndAppDetails() {
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  const currentApp: ReturnType<typeof getCurrentApplication> = yield select(
    getCurrentApplication,
  );
  const user: ReturnType<typeof getCurrentUser> = yield select(getCurrentUser);
  const instanceId: ReturnType<typeof getInstanceId> =
    yield select(getInstanceId);
  const pageId: ReturnType<typeof getCurrentPageId> =
    yield select(getCurrentPageId);
  const userAndAppDetails: UserAndAppDetails = {
    pageId,
    appId: currentApp?.id || "",
    appMode,
    appName: currentApp?.name || "",
    isExampleApp: currentApp?.appIsExample || false,
    userId: user?.username || "",
    email: user?.email || "",
    source: getUserSource(),
    instanceId: instanceId,
  };

  return userAndAppDetails;
}
export function* logDynamicTriggerExecution({
  dynamicTrigger,
  errors,
  triggerMeta,
}: {
  dynamicTrigger: string;
  errors: unknown;
  triggerMeta: TriggerMeta;
}) {
  if (triggerMeta.triggerKind !== TriggerKind.EVENT_EXECUTION) return;
  const isUnsuccessfulExecution = isArray(errors) && errors.length > 0;
  const {
    appId,
    appMode,
    appName,
    email,
    instanceId,
    isExampleApp,
    pageId,
    source,
    userId,
  }: UserAndAppDetails = yield call(getUserAndAppDetails);
  const widget: ReturnType<typeof getWidget> | undefined = yield select(
    (state: AppState) => getWidget(state, triggerMeta.source?.id || ""),
  );

  const dynamicPropertyPathList = widget?.dynamicPropertyPathList;
  const isJSToggled = !!dynamicPropertyPathList?.find(
    (property) => property.key === triggerMeta.triggerPropertyName,
  );
  AnalyticsUtil.logEvent("EXECUTE_ACTION", {
    type: "JS_EXPRESSION",
    unevalValue: dynamicTrigger,
    pageId,
    appId,
    appMode,
    appName,
    isExampleApp,
    userData: {
      userId,
      email,
      appId,
      source,
    },
    widgetName: widget?.widgetName,
    widgetType: widget?.type,
    propertyName: triggerMeta.triggerPropertyName,
    instanceId,
    isJSToggled,
  });

  AnalyticsUtil.logEvent(
    isUnsuccessfulExecution
      ? "EXECUTE_ACTION_FAILURE"
      : "EXECUTE_ACTION_SUCCESS",
    {
      type: "JS_EXPRESSION",
      unevalValue: dynamicTrigger,
      pageId,
      appId,
      appMode,
      appName,
      isExampleApp,
      userData: {
        userId,
        email,
        appId,
        source,
      },
      widgetName: widget?.widgetName,
      widgetType: widget?.type,
      propertyName: triggerMeta.triggerPropertyName,
      instanceId,
      isJSToggled,
    },
  );
}
