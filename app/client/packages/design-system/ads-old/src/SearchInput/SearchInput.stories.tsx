import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

import SearchInputComponent from "./index";

export default {
  title: "Design System/Mobile/Search Input",
  component: SearchInputComponent,
} as ComponentMeta<typeof SearchInputComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof SearchInputComponent> = (args) => {
  return <SearchInputComponent {...args} />;
};

export const SearchInput = Template.bind({});
SearchInput.args = {};
