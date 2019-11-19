import { WidgetType, RenderMode } from "constants/WidgetConstants";
import {
  WidgetBuilder,
  WidgetProps,
  WidgetDataProps,
} from "widgets/BaseWidget";
import { WidgetPropertyValidationType } from "./ValidationFactory";

class WidgetFactory {
  static widgetMap: Map<WidgetType, WidgetBuilder<WidgetProps>> = new Map();
  static widgetPropValidationMap: Map<
    WidgetType,
    WidgetPropertyValidationType
  > = new Map();

  static registerWidgetBuilder(
    widgetType: WidgetType,
    widgetBuilder: WidgetBuilder<WidgetProps>,
    widgetPropertyValidation: WidgetPropertyValidationType,
  ) {
    this.widgetMap.set(widgetType, widgetBuilder);
    this.widgetPropValidationMap.set(widgetType, widgetPropertyValidation);
  }

  static createWidget(
    widgetData: WidgetDataProps,
    renderMode: RenderMode,
  ): JSX.Element {
    const widgetProps: WidgetProps = {
      key: widgetData.widgetId,
      isVisible: true,
      ...widgetData,
      renderMode: renderMode,
    };
    const widgetBuilder = this.widgetMap.get(widgetData.type);
    if (widgetBuilder) {
      // TODO validate props here
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

  static getWidgetPropertyValidationMap(
    widgetType: WidgetType,
  ): WidgetPropertyValidationType {
    const map = this.widgetPropValidationMap.get(widgetType);
    if (!map) {
      console.error("Widget type validation is not defined");
      return {};
    }
    return map;
  }
}

export interface WidgetCreationException {
  message: string;
}

export default WidgetFactory;
