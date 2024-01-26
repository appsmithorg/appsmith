import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

import { getDefaultISDCode } from "../../constants";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  widgetName: "PhoneInput",
  version: 1,
  defaultDialCode: getDefaultISDCode().dial_code,
  allowDialCodeChange: false,
  allowFormatting: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
} as WidgetDefaultProps;
