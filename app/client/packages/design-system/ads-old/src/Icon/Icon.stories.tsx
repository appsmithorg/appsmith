import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import IconComponent, { IconCollection, IconSize } from "./index";
import styled from "styled-components";

export default {
  title: "Design System/Icon",
  component: IconComponent,
  argTypes: {
    size: {
      control: "select",
      options: [
        IconSize.XXS,
        IconSize.XS,
        IconSize.SMALL,
        IconSize.MEDIUM,
        IconSize.LARGE,
        IconSize.XL,
        IconSize.XXL,
        IconSize.XXXL,
        IconSize.XXXXL,
      ],
    },
    name: {
      control: "select",
      options: IconCollection,
    },
  },
} as ComponentMeta<typeof IconComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof IconComponent> = (args) => (
  <IconComponent {...args} />
);

export const Icon = Template.bind({}) as StoryObj;
Icon.args = {
  name: "filter",
  size: IconSize.XXXXL,
  fillColor: "gray",
  withWrapper: false,
};

const IconWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
`;

const AllIconsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const AllIcons = () => {
  return (
    <AllIconsWrapper>
      {IconCollection.map((icon, index) => (
        <IconWrapper key={index}>
          <IconComponent name={icon} size={IconSize.XXXXL} />
          <p>{icon}</p>
        </IconWrapper>
      ))}
    </AllIconsWrapper>
  );
};

AllIcons.decorators = [
  (Story) => (
    <div style={{ height: "75%", width: "25%" }}>
      <Story />
    </div>
  ),
];
