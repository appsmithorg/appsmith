import type { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import type {
  EventType,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";

export default class ExecutionMetaData {
  private static triggerMeta?: TriggerMeta;
  private static eventType?: EventType;
  private static jsVarUpdateDisabled?: boolean;
  private static jsVarUpdateTrackingDisabled?: boolean;

  static setExecutionMetaData(metaData: {
    triggerMeta?: TriggerMeta;
    eventType?: EventType;
    jsVarUpdateDisabled?: boolean;
    jsVarUpdateTrackingDisabled?: boolean;
  }) {
    const metaDataEntries = Object.entries(metaData);
    for (const [key, value] of metaDataEntries) {
      // @ts-expect-error: type unknown
      ExecutionMetaData[key] = value;
    }
  }
  static getExecutionMetaData() {
    const { source, triggerPropertyName } = ExecutionMetaData.triggerMeta || {};
    return {
      triggerMeta: {
        source: { ...source } as TriggerSource,
        triggerPropertyName,
      },
      eventType: ExecutionMetaData.eventType,
      jsVarUpdateDisabled: ExecutionMetaData.jsVarUpdateDisabled,
      jsVarUpdateTrackingDisabled:
        ExecutionMetaData.jsVarUpdateTrackingDisabled,
    };
  }
}
