import React from "react";
import { withKnobs, boolean, text, select } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import SearchInput, { SearchVariant } from "components/ads/SearchInput";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Search Input",
  component: SearchInput,
  decorators: [withKnobs],
};

export function SearchInputStory() {
  return (
    <StoryWrapper>
      <SearchInput
        defaultValue={text("defaultValue", "Type any search keyword")}
        fill={boolean("fill", false)}
        onChange={action("searched value")}
        placeholder={text("placeholder", "Search for apps...")}
        variant={select(
          "variant",
          Object.values(SearchVariant),
          SearchVariant.SEAMLESS,
        )}
      />
    </StoryWrapper>
  );
}
