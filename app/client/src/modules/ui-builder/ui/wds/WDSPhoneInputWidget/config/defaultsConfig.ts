import {
  INPUT_TYPES,
  WDSBaseInputWidget,
} from "modules/ui-builder/ui/wds/WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

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
  inputType: INPUT_TYPES.PHONE_NUMBER,
} as WidgetDefaultProps;
