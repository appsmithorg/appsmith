import React from "react";
import { withKnobs, boolean, text, select } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import SearchInput, { SearchVariant } from "../ads/SearchInput";

export default {
  title: "Search Input",
  component: SearchInput,
  decorators: [withKnobs],
};

export const SearchInputStory = () => (
  <div style={{ background: "#302D2D", height: "500px", padding: "100px" }}>
    <SearchInput
      placeholder={text("placeholder", "Search for apps...")}
      variant={select(
        "variant",
        [SearchVariant.BACKGROUND, SearchVariant.SEAMLESS],
        SearchVariant.SEAMLESS,
      )}
      fill={boolean("fill", false)}
      defaultValue={text("defaultValue", "Type any search keyword")}
      onChange={action("searched value")}
    ></SearchInput>
  </div>
);
