import IconSVG from "./icon.svg";
import Widget from "./widget";
import { ButtonVariantTypes } from "components/constants";
import { Colors } from "constants/Colors";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "JSON Form",
  iconSVG: IconSVG,
  needsMeta: true,
  defaults: {
    animateLoading: true,
    backgroundColor: "#fff",
    columns: 25,
    disabledWhenInvalid: true,
    fixedFooter: true,
    rows: 50,
    schema: {},
    scrollContents: true,
    showReset: true,
    title: "Form",
    version: 1,
    widgetName: "JSONForm",
    autoGenerateForm: true,
    fieldLimitExceeded: false,
    submitButtonStyles: {
      buttonColor: Colors.GREEN,
      buttonVariant: ButtonVariantTypes.PRIMARY,
    },
    resetButtonStyles: {
      buttonColor: Colors.GREEN,
      buttonVariant: ButtonVariantTypes.SECONDARY,
    },
    sourceData: {
      name: "John",
      date_of_birth: "20/02/1990",
      employee_id: 1001,
    },
    submitButtonLabel: "Submit",
    resetButtonLabel: "Reset",
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
  },
};

export default Widget;
