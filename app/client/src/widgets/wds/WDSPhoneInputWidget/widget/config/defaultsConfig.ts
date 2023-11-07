import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { WDSBaseInputWidget } from "widgets/wds/WDSBaseInputWidget";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import { getDefaultISDCode } from "../../constants";

export const defaultsConfig = {
  ...WDSBaseInputWidget.getDefaults(),
  widgetName: "PhoneInput",
  version: 1,
  rows: 7,
  defaultDialCode: getDefaultISDCode().dial_code,
  allowDialCodeChange: false,
  allowFormatting: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
};
