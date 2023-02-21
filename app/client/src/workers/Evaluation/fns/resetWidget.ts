import { promisify } from "./utils/Promisify";

function resetWidgetFnDescriptor(widgetName: string, resetChildren = true) {
  return {
    type: "RESET_WIDGET_META_RECURSIVE_BY_NAME" as const,
    payload: { widgetName, resetChildren },
  };
}

export type TResetWidgetArgs = Parameters<typeof resetWidgetFnDescriptor>;
export type TResetWidgetDescription = ReturnType<
  typeof resetWidgetFnDescriptor
>;
export type TResetWidgetActionType = TResetWidgetDescription["type"];

async function resetWidget(
  ...args: Parameters<typeof resetWidgetFnDescriptor>
) {
  return promisify(resetWidgetFnDescriptor)(...args);
}

export default resetWidget;
