import * as React from "react";
import { SearchComponent } from "@design-system/widgets-old";

import type { ComponentStory } from "@storybook/react";

// TODO: How to write well-typed stories for a class component?
export default {
  title: "Design System/Widgets-old/Search Input",
  component: SearchComponent,
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const Template: ComponentStory<typeof SearchComponent> = (args) => (
  <SearchComponent {...args} />
);

export const SearchInput = Template.bind({});
SearchInput.args = {
  onSearch: () => {
    // eslint-disable-next-line no-console
    console.log("test");
  },
  placeholder: "This is a placeholder",
  value: "",
};
