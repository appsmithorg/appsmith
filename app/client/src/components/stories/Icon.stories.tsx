import React from "react";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Icon from "components/ads/Icon";
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
      icon={select("iconName", ["delete", "user"], "delete")}
      isLoading={boolean("Loading", false)}
      disabled={boolean("Disabled", false)}
    ></Button>
  </StoryWrapper>
);

export const BordelessIcon = () => (
  <StoryWrapper>
    <Icon
      size={select("size", [Size.small, Size.medium, Size.large], Size.large)}
      name={select("iconName", ["delete", "user"], "delete")}
    />
  </StoryWrapper>
);

export const BorderlessAppIcon = () => (
  <StoryWrapper>
    <AppIcon
      size={select("size", [Size.small, Size.medium, Size.large], Size.small)}
      name={select(
        "select icon",
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
