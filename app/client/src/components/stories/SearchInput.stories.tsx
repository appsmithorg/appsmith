import React from "react";
import { withKnobs, boolean, text, select } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "Search Input",
  component: SearchInput,
  decorators: [withKnobs],
};

export const SearchInputStory = () => (
  <StoryWrapper>
    <SearchInput
      placeholder={text("placeholder", "Search for apps...")}
      variant={select(
        "variant",
        Object.values(SearchVariant),
        SearchVariant.SEAMLESS,
      )}
      fill={boolean("fill", false)}
      defaultValue={text("defaultValue", "Type any search keyword")}
      onChange={action("searched value")}
    ></SearchInput>
  </StoryWrapper>
);
