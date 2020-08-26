import React from "react";
import Button, { Size, Category, Variant } from "components/ads/Button";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import Icon from "../ads/Icon";
import AppIcon, { AppIconName } from "../ads/AppIcon";

export default {
  title: "Icon",
  component: Icon,
  decorators: [withKnobs, withDesign],
};

export const ButtonIcon = () => (
  <div style={{ padding: "50px", background: "#2B2B2B", height: "500px" }}>
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
  </div>
);

export const BordelessIcon = () => (
  <div style={{ padding: "50px", background: "#2B2B2B", height: "500px" }}>
    <Icon
      size={select("size", [Size.small, Size.medium, Size.large], Size.large)}
      name={select("iconName", ["delete", "user"], "delete")}
    />
  </div>
);

export const BorderlessAppIcon = () => (
  <div style={{ padding: "50px", background: "#2B2B2B", height: "500px" }}>
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
  </div>
);
