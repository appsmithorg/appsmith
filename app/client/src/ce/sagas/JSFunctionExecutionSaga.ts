import type { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import type { TMessage } from "utils/MessageUtil";
import type { UserAndAppDetails } from "./analyticsSaga";
import { getUserAndAppDetails } from "./analyticsSaga";
import { call, select } from "redux-saga/effects";
import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { getJSActionFromName } from "selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import { getWidget } from "sagas/selectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

export function* logJSFunctionExecution(
  message: TMessage<{
    data: {
      jsFnFullName: string;
      isSuccess: boolean;
      triggerMeta: {
        source: TriggerSource;
        triggerPropertyName: string | undefined;
        triggerKind: TriggerKind | undefined;
      };
    }[];
  }>,
) {
  const allExecutionData = message.body.data;
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
  const filteredData = allExecutionData.filter(
    (execData) =>
      execData.triggerMeta.triggerKind === TriggerKind.EVENT_EXECUTION,
  );

  for (const { isSuccess, jsFnFullName, triggerMeta } of filteredData) {
    const { entityName: JSObjectName, propertyPath: functionName } =
      getEntityNameAndPropertyPath(jsFnFullName);
    const jsAction: ReturnType<typeof getJSActionFromName> = yield select(
      (state: AppState) =>
        getJSActionFromName(state, JSObjectName, functionName),
    );
    const triggeredWidget: ReturnType<typeof getWidget> | undefined =
      yield select((state: AppState) =>
        getWidget(state, triggerMeta.source?.id || ""),
      );
    const dynamicPropertyPathList = triggeredWidget?.dynamicPropertyPathList;
    const isJSToggled = !!dynamicPropertyPathList?.find(
      (property) => property.key === triggerMeta.triggerPropertyName,
    );
    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: "JS",
      name: functionName,
      JSObjectName,
      pageId,
      appId,
      appMode,
      appName,
      isExampleApp,
      actionId: jsAction?.id,
      userData: {
        userId,
        email,
        appId,
        source,
      },
      widgetName: triggeredWidget?.widgetName,
      widgetType: triggeredWidget?.type,
      propertyName: triggerMeta.triggerPropertyName,
      isJSToggled,
      instanceId,
    });

    AnalyticsUtil.logEvent(
      isSuccess ? "EXECUTE_ACTION_SUCCESS" : "EXECUTE_ACTION_FAILURE",
      {
        type: "JS",
        name: functionName,
        JSObjectName,
        pageId,
        appId,
        appMode,
        appName,
        isExampleApp,
        actionId: jsAction?.id,
        userData: {
          userId,
          email,
          appId,
          source,
        },
        widgetName: triggeredWidget?.widgetName,
        widgetType: triggeredWidget?.type,
        propertyName: triggerMeta.triggerPropertyName,
        isJSToggled,
        instanceId,
      },
    );
  }
}
