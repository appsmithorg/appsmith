import type { AnvilConfig, SizeConfig } from "WidgetProvider/constants";
import { RenderModes } from "constants/WidgetConstants";
import { MOBILE_BREAKPOINT } from "layoutSystems/anvil/utils/constants";
import type { WidgetProps } from "widgets/BaseWidget";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: true,
  widgetSize: (props: WidgetProps, isPreviewMode: boolean): SizeConfig => {
    return {
      minWidth:
        props?.renderMode === RenderModes.CANVAS && !isPreviewMode
          ? {}
          : {
              base: "100%",
              [`${MOBILE_BREAKPOINT}px`]: "min-content",
            },
    };
  },
};
