import { largeWidgets, type AnvilConfig } from "WidgetProvider/constants";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: !!largeWidgets["WDS_CHECKBOX_GROUP_WIDGET"],
  widgetSize: {
    maxHeight: {},
    maxWidth: {},
    minHeight: { base: "42px" },
    minWidth: { base: "130px" },
  },
};
