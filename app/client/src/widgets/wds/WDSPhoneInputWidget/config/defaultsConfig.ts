import type { WidgetDefaultProps } from "WidgetProvider/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";

import { getDefaultISDCode } from "../constants";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  widgetName: "PhoneInput",
  version: 1,
  defaultDialCode: getDefaultISDCode().dial_code,
  allowDialCodeChange: false,
  allowFormatting: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  label: "Phone number",
} as WidgetDefaultProps;
