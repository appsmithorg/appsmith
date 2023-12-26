import type { AnvilConfig } from "WidgetProvider/constants";
import { MOBILE_BREAKPOINT } from "layoutSystems/anvil/utils/constants";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: true,
  widgetSize: {
    minWidth: { base: "100%", [`${MOBILE_BREAKPOINT}px`]: "min-content" },
    minHeight: { base: "50px" },
  },
};
