import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
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
    // triggerMeta.onPageLoad is not used in this function. A default value, false, is passed to it to comply with TriggerMeta interface
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

        // triggerMeta.onPageLoad is not used in this function. A default value, false, is passed to it to comply with TriggerMeta interface
        onPageLoad: false,
      },
      eventType: ExecutionMetaData.eventType,
      enableJSVarUpdateTracking: ExecutionMetaData.enableJSVarUpdateTracking,
      enableJSFnPostProcessors: ExecutionMetaData.enableJSFnPostProcessors,
    };
  }
}
