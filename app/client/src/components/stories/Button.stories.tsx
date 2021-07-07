import React from "react";
import Button, { Size, Category } from "components/ads/Button";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { StoryWrapper, Variant } from "components/ads/common";
import { IconCollection, IconName } from "components/ads/Icon";

export default {
  title: "Button",
  component: Button,
  decorators: [withKnobs, withDesign],
};

export const withDynamicProps = () => (
  <StoryWrapper>
    <Button
      category={select("category", Object.values(Category), Category.primary)}
      disabled={boolean("Disabled", false)}
      fill={boolean("fill", false)}
      icon={select(
        "Icon name",
        ["Select icon" as IconName, ...IconCollection],
        "Select icon" as IconName,
      )}
      isLoading={boolean("Loading", false)}
      size={select("size", Object.values(Size), Size.large)}
      text={text("text", "Get")}
      variant={select("variant", Object.values(Variant), Variant.info)}
    />
  </StoryWrapper>
);
