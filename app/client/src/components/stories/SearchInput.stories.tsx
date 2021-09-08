import React from "react";
import { withDesign } from "storybook-addon-designs";
import { action } from "@storybook/addon-actions";
import SearchInput, {
  TextInputProps,
  SearchVariant,
} from "components/ads/SearchInput";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.searchInput.PATH,
  component: SearchInput,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function SearchInputStory(args: TextInputProps) {
  return <SearchInput {...args} onChange={action("value-changed")} />;
}

SearchInputStory.args = {
  placeholder: "Placeholder",
  fill: false,
  defaultValue: "",
  variant: SearchVariant.BACKGROUND,
};

SearchInputStory.argTypes = {
  variant: {
    control: controlType.SELECT,
    options: Object.values(SearchVariant),
  },
  fill: { control: controlType.BOOLEAN },
  placeholder: { control: controlType.TEXT },
  defaultValue: { control: controlType.TEXT },
};

SearchInputStory.storyName = storyName.platform.form.searchInput.NAME;

// export function SearchInputStory() {
//   return (
//     <StoryWrapper>
//       <SearchInput
//         defaultValue={text("defaultValue", "Type any search keyword")}
//         fill={boolean("fill", false)}
//         onChange={action("searched value")}
//         placeholder={text("placeholder", "Search for apps...")}
//         variant={select(
//           "variant",
//           Object.values(SearchVariant),
//           SearchVariant.SEAMLESS,
//         )}
//       />
//     </StoryWrapper>
//   );
// }
