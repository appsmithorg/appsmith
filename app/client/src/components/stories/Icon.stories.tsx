import React from "react";
import Icon, { IconSize, IconCollection } from "components/ads/Icon";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AppIcon, { AppIconCollection } from "components/ads/AppIcon";
import { StoryWrapper } from "components/ads/common";

export default {
  title: "Icon",
  component: Icon,
  decorators: [withKnobs, withDesign],
};

export const ButtonIcon = () => (
  <StoryWrapper>
    <Button
      size={select("size", Object.values(Size), Size.large)}
      category={select("category", Object.values(Category), Category.primary)}
      variant={select("variant", Object.values(Variant), Variant.info)}
      icon={select("Icon name", IconCollection, "delete")}
      isLoading={boolean("Loading", false)}
      disabled={boolean("Disabled", false)}
    ></Button>
  </StoryWrapper>
);

export const BordelessIcon = () => (
  <StoryWrapper>
    <Icon
      size={select("Icon size", Object.values(IconSize), IconSize.LARGE)}
      name={select("Icon name", IconCollection, "delete")}
    />
  </StoryWrapper>
);

export const AppIconVariant = () => (
  <StoryWrapper>
    <AppIcon
      size={select("Icon size", Object.values(Size), Size.small)}
      name={select("Select Icon", AppIconCollection, "bag")}
    />
  </StoryWrapper>
);
