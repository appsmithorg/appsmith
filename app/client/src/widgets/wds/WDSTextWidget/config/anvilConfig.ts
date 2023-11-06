import { largeWidgets, type AnvilConfig } from "WidgetProvider/constants";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: largeWidgets["WDS_TEXT_WIDGET"],
  widgetSize: {
    maxHeight: {},
    maxWidth: {},
    minHeight: { base: "40px" },
    minWidth: { base: "120px" },
  },
};
