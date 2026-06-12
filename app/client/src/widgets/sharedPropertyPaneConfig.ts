import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";

export const TAB_ORDER_PROPERTY_CONFIG: PropertyPaneControlConfig & {
  placeholderText: string;
} = {
  propertyName: "tabOrder",
  label: "Tab order",
  helpText:
    "Sets the keyboard Tab navigation order. Widgets with a tab order are focused first (lowest first); widgets without one follow in position-based order",
  controlType: "INPUT_TEXT",
  placeholderText: "1",
  isBindProperty: true,
  isTriggerProperty: false,
  validation: {
    type: ValidationTypes.NUMBER,
    params: { natural: true, min: 1 },
  },
};
