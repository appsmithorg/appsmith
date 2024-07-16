import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import ProgressiveImageComponent from "./index";
import styled from "styled-components";

const StyledDiv = styled.div`
  img {
    width: 15vw !important;
    height: 30vh !important;
  }
`;

export default {
  title: "Design System/ProgressiveImage",
  component: ProgressiveImageComponent,
  decorators: [
    (Story) => (
      <StyledDiv>
        <Story />
      </StyledDiv>
    ),
  ],
} as ComponentMeta<typeof ProgressiveImageComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ProgressiveImageComponent> = (args) => {
  return <ProgressiveImageComponent {...args} />;
};

export const ProgressiveImage = Template.bind({});
ProgressiveImage.args = {
  thumbnailSource: "https://via.placeholder.com/5x5",
  imageSource: "https://via.placeholder.com/600x600",
  alt: "Progressive Image",
};
