import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import { Divider } from "./Divider";
import styled from "styled-components";

export default {
  title: "ADS/Divider",
  component: Divider,
  argTypes: {
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "radio" },
    },
  },
} as ComponentMeta<typeof Divider>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof Divider> = (args) => {
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

export const DividerStory = Template.bind({});
DividerStory.storyName = "Divider";

export const DividerVerticalStory = Template.bind({});
DividerVerticalStory.args = {
  orientation: "vertical",
};
