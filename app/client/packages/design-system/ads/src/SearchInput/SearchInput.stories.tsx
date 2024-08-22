import React from "react";

import type { StoryObj } from "@storybook/react";

import { SearchInput } from "./SearchInput";
import type { SearchInputProps } from "./SearchInput.types";

export default {
  title: "ADS/Components/Input/SearchInput",
  component: SearchInput,
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%", maxWidth: "250px", margin: "0 auto" }}>
        {Story()}
      </div>
    ),
  ],
};

// eslint-disable-next-line react/function-component-definition
const Template = (args: SearchInputProps) => {
  return <SearchInput {...args} />;
};

export const SearchInputStory = Template.bind({}) as StoryObj;
SearchInputStory.storyName = "SearchInput";
SearchInputStory.args = {};
