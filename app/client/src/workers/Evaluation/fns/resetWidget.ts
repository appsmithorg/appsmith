import { promisify } from "./utils/Promisify";

function resetWidgetFnDescriptor(widgetName: string, resetChildren = true) {
  return {
    type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
    payload: { widgetName, resetChildren },
  };
}

const resetWidget = promisify(resetWidgetFnDescriptor);

export default resetWidget;
