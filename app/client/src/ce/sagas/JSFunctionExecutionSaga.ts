import { TriggerKind } from "constants/AppsmithActionConstants/ActionConstants";
import type { TriggerSource } from "constants/AppsmithActionConstants/ActionConstants";
import { fork } from "redux-saga/effects";
import type { TMessage } from "utils/MessageUtil";
import { logJSActionExecution } from "./analyticsSaga";

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

  // We only care about EVENT_EXECUTION in ce
  const filteredExecutionData = executionData.filter(
    (execData) =>
      execData.triggerMeta.triggerKind === TriggerKind.EVENT_EXECUTION,
  );
  yield fork(logJSActionExecution, filteredExecutionData);
  return data;
}
