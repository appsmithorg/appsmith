import type { AnvilConfig, SizeConfig } from "WidgetProvider/constants";
import type { ZoneWidgetProps } from "..";
import { RenderModes } from "constants/WidgetConstants";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: true,
  widgetSize: (props: ZoneWidgetProps): SizeConfig => {
    return {
      minWidth: {
        base: props.renderMode === RenderModes.CANVAS ? "120px" : `min-content`,
      },
      minHeight: { base: "50px" },
    };
  },
};
