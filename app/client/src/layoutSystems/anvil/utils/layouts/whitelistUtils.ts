import { isLargeWidget } from "../widgetUtils";

export function areWidgetsWhitelisted(
  widgetTypes: string[],
  allowedWidgetTypes: string[],
): boolean {
  if (allowedWidgetTypes.includes("LARGE_WIDGETS")) {
    return widgetTypes.some((type: string) => {
      return isLargeWidget(type);
    });
  } else if (allowedWidgetTypes.includes("SMALL_WIDGETS")) {
    return widgetTypes.every((type: string) => {
      return !isLargeWidget(type);
    });
  } else {
    return widgetTypes.every((type: string) => {
      return allowedWidgetTypes.includes(type);
    });
  }
}
