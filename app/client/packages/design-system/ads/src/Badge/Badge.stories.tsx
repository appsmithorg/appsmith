import React from "react";
import type { StoryObj } from "@storybook/react";
import { Badge } from "./Badge";
import styled from "styled-components";
import type { BadgeProps } from "./Badge.types";

export default {
  title: "ADS/Components/Badge",
  component: Badge,
  argTypes: {
    kind: {
      options: ["success", "error", "warning"],
      control: { type: "radio" },
    },
  },
};

const Template = (args: BadgeProps) => {
  return (
    <Box>
      <Badge {...args} />
    </Box>
  );
};

const Box = styled.div`
  width: 8vh;
  height: 8vh;

  display: flex;
  align-items: center;
  justify-content: center;
`;

export const BadgeStory = Template.bind({}) as StoryObj;

export const ButtonSuccessStory = Template.bind({}) as StoryObj;
ButtonSuccessStory.args = {
  kind: "success",
};

export const ButtonErrorStory = Template.bind({}) as StoryObj;
ButtonErrorStory.args = {
  kind: "error",
};

export const ButtonWarningStory = Template.bind({}) as StoryObj;
ButtonWarningStory.args = {
  kind: "warning",
};
