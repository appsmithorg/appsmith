import * as React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import {
  Icon as IconComponent,
  IconCollection,
  IconSize,
} from "@design-system/widgets-old";
import styled from "styled-components";

export default {
  title: "Design System/Widgets-old/Icon",
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

export const Icon = Template.bind({});
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
  (Story: any) => (
    <div style={{ height: "75%", width: "25%" }}>
      <Story />
    </div>
  ),
];
