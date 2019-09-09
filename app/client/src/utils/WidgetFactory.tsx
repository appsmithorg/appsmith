import { WidgetType } from "../constants/WidgetConstants";
import { WidgetBuilder, WidgetProps } from "../widgets/BaseWidget";

class WidgetFactory {
  static widgetMap: Map<WidgetType, WidgetBuilder<WidgetProps>> = new Map();

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps>,
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
  }

  static createWidget(widgetData: WidgetProps): JSX.Element {
    widgetData.key = widgetData.widgetId;
    const widgetBuilder = this.widgetMap.get(widgetData.widgetType);
    if (widgetBuilder) return widgetBuilder.buildWidget(widgetData);
    else {
      const ex: WidgetCreationException = {
        message:
          "Widget Builder not registered for widget type" +
          widgetData.widgetType,
      };
      throw ex;
    }
  }

  static getWidgetTypes(): WidgetType[] {
    return Array.from(this.widgetMap.keys());
  }
}

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
