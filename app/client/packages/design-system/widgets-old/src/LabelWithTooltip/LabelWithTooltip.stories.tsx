import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import { LabelWithTooltip, LabelPosition } from "@design-system/widgets-old";
import { Alignment } from "@blueprintjs/core";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/Widgets-old/LabelWithTooltip",
  component: LabelWithTooltip,
} as ComponentMeta<typeof LabelWithTooltip>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof LabelWithTooltip> = (args) => {
  return <LabelWithTooltip {...args} />;
};

export const LabelWithTooltipExample = Template.bind({});
LabelWithTooltipExample.storyName = "Label With Tooltip";
LabelWithTooltipExample.args = {
  alignment: Alignment.CENTER,
  compact: true,
  disabled: false,
  inline: true,
  loading: false,
  optionCount: 4,
  position: LabelPosition.Auto,
  text: "this is a Label",
  helpText: "Here is the tooltip",
};
