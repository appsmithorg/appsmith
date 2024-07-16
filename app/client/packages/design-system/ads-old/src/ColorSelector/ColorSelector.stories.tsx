import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import ColorSelector from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/ColorSelector",
  component: ColorSelector,
} as ComponentMeta<typeof ColorSelector>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ColorSelector> = (args) => {
  return <ColorSelector {...args} />;
};

const appColors = [
  "#FFEFDB",
  "#D9E7FF",
  "#FFDEDE",
  "#E3DEFF",
  "#C7F3E3",
  "#F1DEFF",
  "#F4FFDE",
  "#C7F3F0",
  "#C2DAF0",
  "#F5D1D1",
  "#ECECEC",
  "#CCCCCC",
  "#F3F1C7",
  "#E4D8CC",
  "#EAEDFB",
  "#D6D1F2",
  "#FBF4ED",
  "#FFEBFB",
];

export const ColorSelectorExample = Template.bind({});
ColorSelectorExample.storyName = "Color Selector";
ColorSelectorExample.args = {
  colorPalette: appColors,
  fill: true,
  onSelect: () => console.log("selected color updated"),
};
