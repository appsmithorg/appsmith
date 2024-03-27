import type { AnvilConfig } from "WidgetProvider/constants";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: false,
  widgetSize: {
    paddingTop: "spacing-3",
    paddingBottom: "spacing-3",
    minWidth: {
      base: "100%",
      "180px": "sizing-30",
    },
  },
};
