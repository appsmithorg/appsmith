import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import type { Props } from "./index";
import {
  DropdownV2,
  DropdownList,
  DropdownItem,
  DropdownTrigger,
} from "./index";
import type {
  IMenuItemProps,
  IMenuProps,
  IPopoverProps,
} from "@blueprintjs/core";

export default {
  title: "Design System/Dropdown V2",
  component: DropdownV2,
} as ComponentMeta<typeof DropdownV2>;

const DropdownItemTemplate: ComponentStory<typeof DropdownItem> = (
  args: IMenuItemProps,
) => <DropdownItem text={args.text} {...args} />;

export const DropdownItemExample = DropdownItemTemplate.bind({});
DropdownItemExample.storyName = "Dropdown Item";
DropdownItemExample.args = {
  text: "Lorem Ipsum Dolor",
  onClick: () => {
    console.log("clicked");
  },
};

const DropdownListTemplate: ComponentStory<typeof DropdownList> = (
  args: IMenuProps,
) => <DropdownList {...args} />;

export const DropdownListExample = DropdownListTemplate.bind({});
DropdownListExample.storyName = "Dropdown List";
DropdownListExample.args = {
  children: [
    <DropdownItem key="0" {...DropdownItemExample.args} />,
    <DropdownItem key="1" {...DropdownItemExample.args} />,
  ],
};

const DropdownTriggerTemplate: ComponentStory<typeof DropdownTrigger> = (
  args: any,
) => <DropdownTrigger {...args} />;

export const DropdownTriggerExample = DropdownTriggerTemplate.bind({});
DropdownTriggerExample.storyName = "Dropdown Trigger";
DropdownTriggerExample.args = {
  children: <button>Click me</button>,
};

const DropdownTemplate: ComponentStory<typeof DropdownV2> = (
  args: IPopoverProps & Props,
) => <DropdownV2 {...args} />;

export const DropdownExample = DropdownTemplate.bind({});
DropdownExample.storyName = "Dropdown";
DropdownExample.args = {
  children: [
    <DropdownTrigger key="0" {...DropdownTriggerExample.args} />,
    <DropdownList key="1" {...DropdownListExample.args} />,
  ],
};

export const DropdownWithSearch = DropdownTemplate.bind({});
DropdownWithSearch.args = {
  enableSearch: true,
  children: [
    <DropdownTrigger key="0" {...DropdownTriggerExample.args} />,
    <DropdownList key="1" {...DropdownListExample.args} />,
  ],
};
