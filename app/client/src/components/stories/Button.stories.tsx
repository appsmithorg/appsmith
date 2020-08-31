import React from "react";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper } from "./Tabs.stories";
import { IconName } from "components/ads/Icon";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
  <StoryWrapper>
    <Button
      size={select("size", Object.values(Size), Size.large)}
      category={select("category", Object.values(Category), Category.primary)}
      variant={select("variant", Object.values(Variant), Variant.info)}
      icon={select("Icon name", Object.values(IconName), IconName.NO_ICON)}
      isLoading={boolean("Loading", false)}
      disabled={boolean("Disabled", false)}
      text={text("text", "Get")}
    ></Button>
  </StoryWrapper>
);
