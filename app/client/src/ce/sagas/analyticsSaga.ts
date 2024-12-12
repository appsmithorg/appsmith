import { getInstanceId } from "ee/selectors/tenantSelectors";
import { call, select } from "redux-saga/effects";
import type { APP_MODE } from "entities/App";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import { isArray } from "lodash";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppMode } from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import { getWidget } from "sagas/selectors";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

export interface AppDetails {
  pageId: string;
  appId: string;
  appMode: APP_MODE | undefined;
  appName: string;
  isExampleApp: boolean;
  instanceId: string;
}

export function* getAppDetails() {
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  const currentApp: ReturnType<typeof getCurrentApplication> = yield select(
    getCurrentApplication,
  );
  const instanceId: ReturnType<typeof getInstanceId> =
    yield select(getInstanceId);
  const pageId: ReturnType<typeof getCurrentPageId> =
    yield select(getCurrentPageId);

  const appDetails: AppDetails = {
    pageId,
    appId: currentApp?.id || "",
    appMode,
    appName: currentApp?.name || "",
    isExampleApp: currentApp?.appIsExample || false,
    instanceId: instanceId,
  };

  return appDetails;
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
    instanceId,
    isExampleApp,
    pageId,
  }: AppDetails = yield call(getAppDetails);
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
      widgetName: widget?.widgetName,
      widgetType: widget?.type,
      propertyName: triggerMeta.triggerPropertyName,
      instanceId,
      isJSToggled,
    },
  );
}
