import Widget from "./widget";
import IconSVG from "./icon.svg";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { RecaptchaTypes } from "components/constants";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "FormButton",
  iconSVG: IconSVG,
  hideCard: true,
  needsMeta: true,
  defaults: {
    rows: 1 * GRID_DENSITY_MIGRATION_V1,
    columns: 3 * GRID_DENSITY_MIGRATION_V1,
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
  },
};

export default Widget;
