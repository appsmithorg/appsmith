import React from "react";
import { EditorSegments } from "./EditorSegments";
import type { EditorSegmentsProps } from "./EditorSegments.types";
import type { StoryObj } from "@storybook/react";
import { Button } from "../../../Button";

export default {
  title: "ADS/Templates/Editor Segments",
  component: EditorSegments,
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: EditorSegmentsProps) => {
  return <EditorSegments {...args}>{args.children}</EditorSegments>;
};

export const EditorSegmentsStory = Template.bind({}) as StoryObj;
EditorSegmentsStory.storyName = "Default";
EditorSegmentsStory.args = {
  options: [
    {
      value: "queries",
      label: "Queries",
      startIcon: "queries-v3",
    },
    {
      value: "js",
      label: "JS",
      startIcon: "content-type-json",
    },
    {
      value: "ui",
      label: "UI",
      startIcon: "dashboard-line",
      isDisabled: true,
    },
  ],
  defaultValue: "queries",
};

export const EditorSegmentsStoryWithIcons = Template.bind({}) as StoryObj;
EditorSegmentsStoryWithIcons.storyName = "Only Icons";
EditorSegmentsStoryWithIcons.args = {
  options: [
    {
      value: "queries",
      startIcon: "queries-v3",
    },
    {
      value: "js",
      startIcon: "content-type-json",
    },
    {
      value: "ui",
      startIcon: "dashboard-line",
    },
  ],
  defaultValue: "queries",
};

export const EditorSegmentsStoryWithLabels = Template.bind({}) as StoryObj;
EditorSegmentsStoryWithLabels.storyName = "Only Labels";
EditorSegmentsStoryWithLabels.args = {
  options: [
    {
      value: "queries",
      label: "Queries",
    },
    {
      value: "js",
      label: "JS",
    },
    {
      value: "ui",
      label: "UI",
    },
  ],
  defaultValue: "queries",
};

export const EditorSegmentsStoryWithChildren = Template.bind({}) as StoryObj;
EditorSegmentsStoryWithChildren.storyName = "With Children";
EditorSegmentsStoryWithChildren.args = {
  options: [
    {
      value: "queries",
      label: "Queries",
    },
    {
      value: "js",
      label: "JS",
    },
    {
      value: "ui",
      label: "UI",
    },
  ],
  defaultValue: "queries",
  isFullWidth: true,
  children: <Button isIconButton kind="secondary" startIcon="plus" />,
};
