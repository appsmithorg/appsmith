import type { TriggerMeta } from "@appsmith/sagas/ActionExecution/ActionExecutionSagas";
import type {
  EventType,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";

export default class ExecutionMetaData {
  private static triggerMeta?: TriggerMeta;
  private static eventType?: EventType;
  private static enableJSVarUpdateTracking = true;
  private static enableJSFnPostProcessors = true;

  static setExecutionMetaData(metaData: {
    triggerMeta?: TriggerMeta;
    eventType?: EventType;
    enableJSFnPostProcessors?: boolean;
    enableJSVarUpdateTracking?: boolean;
  }) {
    const metaDataEntries = Object.entries(metaData);
    for (const [key, value] of metaDataEntries) {
      // @ts-expect-error: type unknown
      ExecutionMetaData[key] = value;
    }
  }
  static getExecutionMetaData() {
    const { source, triggerKind, triggerPropertyName } =
      ExecutionMetaData.triggerMeta || {};
    return {
      triggerMeta: {
        source: { ...source } as TriggerSource,
        triggerPropertyName,
        triggerKind,
      },
      eventType: ExecutionMetaData.eventType,
      enableJSVarUpdateTracking: ExecutionMetaData.enableJSVarUpdateTracking,
      enableJSFnPostProcessors: ExecutionMetaData.enableJSFnPostProcessors,
    };
  }
}
