import WidgetFactory from "./WidgetFactory";
import { WidgetType } from "constants/WidgetConstants";

export class DerivedPropFactory {
  static getDerivedPropertiesOfWidgetType(
    widgetType: WidgetType,
    widgetName: string,
  ): any {
    // TODO WIDGETFACTORY
    const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
      widgetType,
    );
    const derivedProps: any = {};
    Object.keys(derivedPropertyMap).forEach(propertyName => {
      derivedProps[propertyName] = derivedPropertyMap[propertyName].replace(
        /this./g,
        `${widgetName}.`,
      );
    });
    return derivedProps;
  }
}
