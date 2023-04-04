import type { TriggerMeta } from "ce/sagas/ActionExecution/ActionExecutionSagas";
import type {
  EventType,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";

export default class ExecutionMetaData {
  private static triggerMeta?: TriggerMeta;
  private static eventType?: EventType;
  static setExecutionMetaData(
    triggerMeta?: TriggerMeta,
    eventType?: EventType,
  ) {
    ExecutionMetaData.triggerMeta = triggerMeta;
    ExecutionMetaData.eventType = eventType;
  }
  static getExecutionMetaData() {
    const { source, triggerPropertyName } = ExecutionMetaData.triggerMeta || {};
    return {
      triggerMeta: {
        source: { ...source } as TriggerSource,
        triggerPropertyName,
      },
      eventType: ExecutionMetaData.eventType,
    };
  }
}
