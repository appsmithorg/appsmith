import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverModalContent,
} from "@appsmith/wds-headless";
import { Button } from "react-aria-components";
import { ControlledPopover as ControlledPopoverExample } from "./ControlledPopover";

/**
 * A popover is an interactive mini-dialog floating element that displays information related to an anchor element when the element is clicked.
 *
 * Based on the [headless Popover component](/?path=/docs/design-system-headless-popover--docs).
 *
 * A popover is a floating element that displays information that requires immediate attention, appearing over the page content and blocking interactions with the page until it is dismissed.
 */

const meta: Meta<typeof Popover> = {
  component: Popover,
  title: "WDS/Headless/Popover",
  subcomponents: {
    //@ts-expect-error: don't need props to pass here
    PopoverTrigger,
    //@ts-expect-error: don't need props to pass here
    PopoverContent,
    //@ts-expect-error: don't need props to pass here
    PopoverModalContent,
  },
  render: (args) => (
    <Popover {...args}>
      <PopoverTrigger>
        <Button>My trigger</Button>
      </PopoverTrigger>
      <PopoverContent>My popover</PopoverContent>
    </Popover>
  ),
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Main: Story = {};

/**
 * The placement of the menu can be changed by passing the `placement` prop.
 */
export const Placement: Story = {
  render: () => (
    <>
      <Popover placement="left">
        <PopoverTrigger>
          <Button>Left</Button>
        </PopoverTrigger>
        <PopoverContent>My popover</PopoverContent>
      </Popover>
      <Popover placement="top">
        <PopoverTrigger>
          <Button>Top</Button>
        </PopoverTrigger>
        <PopoverContent>My popover</PopoverContent>
      </Popover>
      <Popover placement="bottom">
        <PopoverTrigger>
          <Button>Bottom</Button>
        </PopoverTrigger>
        <PopoverContent>My popover</PopoverContent>
      </Popover>
      <Popover placement="right">
        <PopoverTrigger>
          <Button>Right</Button>
        </PopoverTrigger>
        <PopoverContent>My popover</PopoverContent>
      </Popover>
    </>
  ),
};

export const ControlledPopover: Story = {
  render: () => <ControlledPopoverExample />,
};
