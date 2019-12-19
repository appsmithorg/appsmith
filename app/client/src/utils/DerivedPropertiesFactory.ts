import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import WidgetFactory from "./WidgetFactory";

export class DerivedPropFactory {
  static getDerivedProperties(
    widgetDataWithValidations: FlattenedWidgetProps,
  ): any {
    const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
      widgetDataWithValidations.type,
    );

    const derivedProps: any = {};
    Object.keys(derivedPropertyMap).forEach(propertyName => {
      const derivedPropertyGetter = derivedPropertyMap[propertyName];
      let propertValue;
      try {
        propertValue = derivedPropertyGetter(widgetDataWithValidations);
        if (propertValue) {
          derivedProps[propertyName] = propertValue;
        }
      } catch (ex) {
        console.error(
          `Property evaluation failed for ${propertyName} for widget ${widgetDataWithValidations.widgetName}`,
        );
      }
    });
    return derivedProps;
  }
}
