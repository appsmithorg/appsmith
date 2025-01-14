import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IDESidebar, type IDESidebarProps } from "./Sidebar";
import { Condition } from "./enums";
import { Flex } from "../../Flex";

export default {
  title: "ADS/Templates/IDE Sidebar",
  component: IDESidebar,
} as Meta;

const Template = (args: IDESidebarProps) => (
  <Flex background="var(--ads-v2-color-bg)" h="400px" width="100px">
    <IDESidebar {...args} />
  </Flex>
);

const topButtons = [
  {
    state: "Editor",
    icon: "editor-v3",
    title: "Editor",
    testId: "Editor",
    urlSuffix: "",
  },
];

const bottomButtons = [
  {
    testId: "warning-button",
    icon: "datasource-v3",
    urlSuffix: "datasource",
    tooltip: "Datasources",
  },
  {
    testId: "settings",
    icon: "settings-v3",
    urlSuffix: "settings",
    tooltip: "Settings",
  },
];

export const Basic = Template.bind({}) as StoryObj;
Basic.args = {
  topButtons,
  bottomButtons,
  editorState: "home",
  // eslint-disable-next-line no-console
  onClick: (urlSuffix: string) => console.log("Clicked:", urlSuffix),
};

export const WithCondition = Template.bind({}) as StoryObj;
WithCondition.args = {
  topButtons,
  bottomButtons: [
    {
      ...bottomButtons[0],
      condition: Condition.Warn,
      tooltip: "No datasource found",
    },
    bottomButtons[1],
  ],
  // eslint-disable-next-line no-console
  onClick: (urlSuffix: string) => console.log("Clicked:", urlSuffix),
  editorState: "settings",
};
