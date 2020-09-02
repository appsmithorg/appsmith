import React from "react";
import Icon, { IconSize, IconCollection } from "components/ads/Icon";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AppIcon, { AppIconCollection } from "components/ads/AppIcon";
import { StoryWrapper } from "./Tabs.stories";

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
      size={select(
        "Icon size",
        [
          IconSize.SMALL,
          IconSize.MEDIUM,
          IconSize.LARGE,
          IconSize.XL,
          IconSize.XXL,
          IconSize.XXXL,
        ],
        IconSize.LARGE,
      )}
      name={select("Icon name", IconCollection, "delete")}
    />
  </StoryWrapper>
);

export const AppIconVariant = () => (
  <StoryWrapper>
    <AppIcon
      size={select(
        "Icon size",
        [Size.small, Size.medium, Size.large],
        Size.small,
      )}
      color={select(
        "Icon color",
        [
          "#4F70FD",
          "#54A9FB",
          "#5ED3DA",
          "#F56AF4",
          "#F36380",
          "#FE9F44",
          "#E9C951",
          "#A8D76C",
          "#6C4CF1",
        ],
        "#4F70FD",
      )}
      name={select("Select Icon", AppIconCollection, "bag")}
    />
  </StoryWrapper>
);
