import React from "react";

import SearchComponent from "./index";

// TODO: How to write well-typed stories for a class component?
export default {
  title: "Design System/widgets-old/Search Input",
  component: SearchComponent,
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const Template = (args) => <SearchComponent {...args} />;

export const SearchInput = Template.bind({});
//@ts-expect-error no type access
SearchInput.args = {
  onSearch: () => {
    // eslint-disable-next-line no-console
    console.log("test");
  },
  placeholder: "This is a placeholder",
  value: "",
};
