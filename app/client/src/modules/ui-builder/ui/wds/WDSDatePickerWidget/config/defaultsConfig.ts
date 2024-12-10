import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { INPUT_TYPES } from "modules/ui-builder/ui/wds/WDSBaseInputWidget";

export const defaultsConfig = {
  animateLoading: true,
  label: "Label",
  dateFormat: "YYYY-MM-DD HH:mm",
  defaultOptionValue: "",
  isRequired: false,
  isDisabled: false,
  isVisible: true,
  isInline: false,
  widgetName: "DatePicker",
  widgetType: "WDS_DATE_PICKER",
  version: 1,
  timePrecision: "day",
  responsiveBehavior: ResponsiveBehavior.Fill,
  inputType: INPUT_TYPES.DATE,
} as unknown as WidgetDefaultProps;
