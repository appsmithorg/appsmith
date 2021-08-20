import React from "react";
import { action } from "@storybook/addon-actions";
import ColorSelector, {
  ColorSelectorProps,
} from "components/ads/ColorSelector";
import { withDesign } from "storybook-addon-designs";
import { theme } from "constants/DefaultTheme";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.colorSelector.PATH,
  component: ColorSelector,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

const defaultValue = theme.colors.appCardColors;

export function Primary(args: ColorSelectorProps) {
  return <ColorSelector {...args} onSelect={action("color-picker")} />;
}

Primary.args = {
  colorPalette: defaultValue,
  fill: false,
};

Primary.argTypes = {
  colorPalette: {
    control: controlType.ARRAY,
  },
  fill: { control: controlType.BOOLEAN },
};

Primary.storyName = storyName.platform.form.colorSelector.NAME;
