import { RecaptchaTypes } from "components/constants";
import IconSVG from "./icon.svg";
import Widget from "./widget";
import type { SnipingModeProperty, PropertyUpdates } from "widgets/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FormButton",
  iconSVG: IconSVG,
  hideCard: true,
  isDeprecated: true,
  replacement: "BUTTON_WIDGET",
  needsMeta: true,
  defaults: {
    rows: 4,
    columns: 12,
    widgetName: "FormButton",
    text: "Submit",
    isDefaultClickDisabled: true,
    recaptchaType: RecaptchaTypes.V3,
    version: 1,
    animateLoading: true,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    stylesheetConfig: Widget.getStylesheetConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
  methods: {
    getSnipingModeUpdates: (
      propValueMap: SnipingModeProperty,
    ): PropertyUpdates[] => {
      return [
        {
          propertyPath: "onClick",
          propertyValue: propValueMap.run,
          isDynamicPropertyPath: true,
        },
      ];
    },
  },
};

export default Widget;
