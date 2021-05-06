import React from "react";
import Icon, { IconSize, IconCollection } from "components/ads/Icon";
import Button, { Size, Category } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AppIcon, { AppIconCollection } from "components/ads/AppIcon";
import { StoryWrapper, Variant } from "components/ads/common";

export default {
  title: "Icon",
  component: Icon,
  decorators: [withKnobs, withDesign],
};

export function ButtonIcon() {
  return (
    <StoryWrapper>
      <Button
        category={select("category", Object.values(Category), Category.primary)}
        disabled={boolean("Disabled", false)}
        icon={select("Icon name", IconCollection, "delete")}
        isLoading={boolean("Loading", false)}
        size={select("size", Object.values(Size), Size.large)}
        variant={select("variant", Object.values(Variant), Variant.info)}
      />
    </StoryWrapper>
  );
}

export function BordelessIcon() {
  return (
    <StoryWrapper>
      <Icon
        name={select("Icon name", IconCollection, "delete")}
        size={select("Icon size", Object.values(IconSize), IconSize.LARGE)}
      />
    </StoryWrapper>
  );
}

export function AppIconVariant() {
  return (
    <StoryWrapper>
      <AppIcon
        name={select("Select Icon", AppIconCollection, "bag")}
        size={select("Icon size", Object.values(Size), Size.small)}
      />
    </StoryWrapper>
  );
}
