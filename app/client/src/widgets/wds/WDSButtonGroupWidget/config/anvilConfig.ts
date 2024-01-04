import type { AnvilConfig, SizeConfig } from "WidgetProvider/constants";
import type { ButtonGroupWidgetProps } from "../widget/types";

export const anvilConfig: AnvilConfig = {
  isLargeWidget: false,
  widgetSize: (props: ButtonGroupWidgetProps): SizeConfig => {
    let minWidth = 120;
    const buttonLength = Object.keys(props.buttonsList).length;
    if (props.orientation === "horizontal") {
      // 120 is the width of the button, 8 is widget padding, 1 is the gap between buttons
      minWidth = 120 * buttonLength + 8 + (buttonLength - 1) * 1;
    }
    return {
      minHeight: { base: "40px" },
      minWidth: { base: `${minWidth}px` },
    };
  },
};
