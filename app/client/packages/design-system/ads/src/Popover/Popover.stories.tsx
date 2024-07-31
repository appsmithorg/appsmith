import React from "react";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from "./Popover";
import { Button } from "../Button";
import { Input } from "../Input";
import { Text } from "../Text";
import styled from "styled-components";
import type { PopoverContentProps, PopoverHeaderProps } from "./Popover.types";
import type { StoryObj } from "@storybook/react";
import type { PopoverProps } from "@radix-ui/react-popover";

export default {
  title: "ADS/Components/Popover",
  component: Popover,
};

const FlexBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  &:last-child {
    gap: var(--ads-v2-spaces-4);
  }
`;

// eslint-disable-next-line react/function-component-definition
const PopoverHeaderTemplate = (args: PopoverHeaderProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent size="md">
        <PopoverHeader {...args} />
      </PopoverContent>
    </Popover>
  );
};

export const PopoverHeaderStory = PopoverHeaderTemplate.bind({}) as StoryObj;
PopoverHeaderStory.storyName = "Header";
PopoverHeaderStory.args = {
  children: "JS Libraries",
  isClosable: true,
};

const PopoverContentTemplate = (args: PopoverContentProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent {...args} />
    </Popover>
  );
};

//  TODO: The popover guidelines say that popovers should have at least one focusable element in it, but this story doesn't because PopoverHeader expects children to be a string. Change this.
export const PopoverContentStory = PopoverContentTemplate.bind({}) as StoryObj;
PopoverContentStory.storyName = "Small Content";
PopoverContentStory.argTypes = {
  size: {
    control: "radio",
    options: ["sm", "md"],
  },
};
PopoverContentStory.args = {
  size: "sm",
  children: (
    <>
      <PopoverHeader isClosable>Chutney Podi</PopoverHeader>
      <PopoverBody>
        <Text>
          Chutney pudi, or milagai podi is a coarse spice powder from southern
          India that typically contains ground dry spices like dried chillis,
          black gram, chickpeas, salt and sesame seeds.
        </Text>
      </PopoverBody>
    </>
  ),
};

export const MediumPopoverContentStory = PopoverContentTemplate.bind(
  {},
) as StoryObj;
MediumPopoverContentStory.storyName = "Medium Content";
MediumPopoverContentStory.argTypes = {
  size: {
    control: "radio",
    options: ["sm", "md"],
  },
};
MediumPopoverContentStory.args = {
  size: "md",
  children: (
    <>
      <PopoverHeader isClosable>Sign in</PopoverHeader>
      <PopoverBody>
        <FlexBox>
          <Input label="Old password" renderAs="input" size="md" />
          <Input label="New Password" renderAs="input" size="md" />
          <Input label="Third input" renderAs="input" size="md" />
          <Input label="Fourth input" renderAs="input" size="md" />
          <Button UNSAFE_width="150px" kind="primary" size="md">
            Change
          </Button>
        </FlexBox>
      </PopoverBody>
    </>
  ),
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: PopoverProps) => {
  return (
    <Popover {...args}>
      <PopoverTrigger>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent size="md">
        <PopoverHeader isClosable>Sign in</PopoverHeader>
        <PopoverBody>
          <FlexBox>
            <Input label="Old password" renderAs="input" size="md" />
            <Input label="New Password" renderAs="input" size="md" />
            <Button UNSAFE_width="150px" kind="primary" size="md">
              Change
            </Button>
          </FlexBox>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export const PopoverStory = Template.bind({}) as StoryObj;
PopoverStory.storyName = "Popover";
PopoverStory.args = {
  //add arguments here
};
