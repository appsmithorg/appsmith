import React from "react";
import Icon, { IconSize, IconName } from "components/ads/Icon";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import AppIcon, { AppIconName } from "components/ads/AppIcon";
import { StoryWrapper } from "./Tabs.stories";

export default {
  title: "Icon",
  component: Icon,
  decorators: [withKnobs, withDesign],
};

export const ButtonIcon = () => (
  <StoryWrapper>
    <Button
      size={select("size", [Size.small, Size.medium, Size.large], Size.large)}
      category={select(
        "category",
        [Category.primary, Category.secondary, Category.tertiary],
        Category.primary,
      )}
      variant={select(
        "variant",
        [Variant.info, Variant.success, Variant.danger, Variant.warning],
        Variant.info,
      )}
      icon={select(
        "Icon name",
        [
          IconName.DELETE,
          IconName.USER,
          IconName.BILLING,
          IconName.LAUNCH,
          IconName.SHARE,
          IconName.CLOSE,
        ],
        IconName.DELETE,
      )}
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
      name={select(
        "Icon name",
        [
          IconName.DELETE,
          IconName.USER,
          IconName.BILLING,
          IconName.LAUNCH,
          IconName.SHARE,
          IconName.CLOSE,
        ],
        IconName.DELETE,
      )}
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
      name={select(
        "Select Icon",
        [
          AppIconName.BAG,
          AppIconName.PRODUCT,
          AppIconName.BOOK,
          AppIconName.CAMERA,
          AppIconName.FILE,
          AppIconName.CHAT,
          AppIconName.CALENDER,
          AppIconName.FLIGHT,
          AppIconName.FRAME,
          AppIconName.GLOBE,
          AppIconName.SHOPPER,
          AppIconName.HEART,
        ],
        AppIconName.BAG,
      )}
    />
  </StoryWrapper>
);
