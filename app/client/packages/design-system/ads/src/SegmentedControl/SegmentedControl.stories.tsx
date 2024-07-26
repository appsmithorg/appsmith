import React from "react";
import { SegmentedControl } from "./SegmentedControl";
import type { SegmentedControlProps } from "./SegmentedControl.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Segmented Control",
  component: SegmentedControl,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: SegmentedControlProps) => {
  return <SegmentedControl {...args} />;
};
// TODO (albin): isFullWidth is not working as expected

export const SegmentedControlStory = Template.bind({}) as StoryObj;
SegmentedControlStory.storyName = "Default";
SegmentedControlStory.args = {
  options: [
    {
      value: "one",
      label: "One",
      startIcon: "arrow-left-s-line",
      endIcon: "arrow-left-s-line",
    },
    {
      value: "two",
      label: "Two",
      startIcon: "arrow-right-s-line",
      endIcon: "arrow-right-s-line",
    },
    {
      value: "three",
      label: "Three",
      startIcon: "arrow-up-s-line",
      endIcon: "arrow-up-s-line",
      isDisabled: true,
    },
    {
      value: "four",
      label: "Four",
      startIcon: "arrow-right-s-line",
      endIcon: "arrow-right-s-line",
    },
    {
      value: "five",
      label: "Five",
      startIcon: "arrow-down-s-line",
      endIcon: "arrow-down-s-line",
    },
  ],
  defaultValue: "one",
  isFullWidth: true,
};

export const SegmentedControlStoryWithIcons = Template.bind({}) as StoryObj;
SegmentedControlStoryWithIcons.storyName = "Only Icons";
SegmentedControlStoryWithIcons.args = {
  options: [
    {
      value: "one",
      startIcon: "arrow-down-s-line",
    },
    {
      value: "two",
      startIcon: "arrow-up-s-line",
    },
    {
      value: "three",
      startIcon: "arrow-left-s-line",
    },
  ],
  defaultValue: "one",
  isFullWidth: true,
};

export const SegmentedControlStoryWithLabels = Template.bind({}) as StoryObj;
SegmentedControlStoryWithLabels.storyName = "Only Labels";
SegmentedControlStoryWithLabels.args = {
  options: [
    {
      value: "one",
      label: "One",
    },
    {
      value: "two",
      label: "Two",
    },
    {
      value: "three",
      label: "Three",
    },
  ],
  defaultValue: "one",
  isFullWidth: true,
};
