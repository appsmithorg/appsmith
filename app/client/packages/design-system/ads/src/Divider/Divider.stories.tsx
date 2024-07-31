import React from "react";
import { Divider } from "./Divider";
import styled from "styled-components";
import type { DividerProps } from "./Divider.types";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Divider",
  component: Divider,
  argTypes: {
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "radio" },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: DividerProps) => {
  return (
    <Box>
      <Divider {...args} />
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

export const DividerStory = Template.bind({}) as StoryObj;
DividerStory.storyName = "Divider";

export const DividerVerticalStory = Template.bind({}) as StoryObj;
DividerVerticalStory.args = {
  orientation: "vertical",
};
