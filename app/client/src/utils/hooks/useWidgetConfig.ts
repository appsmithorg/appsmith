import type { WidgetType } from "WidgetProvider/factory";
import WidgetFactory from "WidgetProvider/factory";

export default function useWidgetConfig(type: WidgetType, attr: string) {
  const config = WidgetFactory.getConfig(type);

  return config?.[attr];
}
