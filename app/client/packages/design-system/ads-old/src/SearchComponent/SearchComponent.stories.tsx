import React from "react";

import SearchComponent from "./index";

// TODO: How to write well-typed stories for a class component?
export default {
  title: "Design System/Search Input",
  component: SearchComponent,
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const Template = (args) => <SearchComponent {...args} />;

export const SearchInput = Template.bind({}) as StoryObj;
SearchInput.args = {
  onSearch: () => {},
  placeholder: "This is a placeholder",
  value: "",
};
