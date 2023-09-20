import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import type { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { call } from "redux-saga/effects";
import type { TMessage } from "utils/MessageUtil";
import { logJSActionExecution } from "@appsmith/sagas/analyticsSaga";

export function* logJSFunctionExecution(
  data: TMessage<{
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
  const {
    body: { data: executionData },
  } = data;

  // We only care about EVENT_EXECUTION
  const triggerExecutionData = executionData.filter(
    (execData) =>
      execData.triggerMeta.triggerKind === TriggerKind.EVENT_EXECUTION,
  );
  yield call(logJSActionExecution, triggerExecutionData);
}
