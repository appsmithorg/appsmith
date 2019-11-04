import { WidgetType, RenderMode } from "../constants/WidgetConstants";
import {
  WidgetBuilder,
  WidgetProps,
  WidgetDataProps,
} from "../widgets/BaseWidget";

class WidgetFactory {
  static widgetMap: Map<WidgetType, WidgetBuilder<WidgetProps>> = new Map();

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps>,
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
  }

  static createWidget(
    widgetData: WidgetDataProps,
    renderMode: RenderMode,
  ): JSX.Element {
    const widgetProps: WidgetProps = {
      key: widgetData.widgetId,
      renderMode: renderMode,
      ...widgetData,
    };
    const widgetBuilder = this.widgetMap.get(widgetData.type);
    if (widgetBuilder) {
      console.log("building widget " + widgetProps.widgetName);
      const widget = widgetBuilder.buildWidget(widgetProps);
      return widget;
    } else {
      const ex: WidgetCreationException = {
        message:
          "Widget Builder not registered for widget type" + widgetData.type,
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
