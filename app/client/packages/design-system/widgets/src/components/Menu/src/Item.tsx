import type { ReactNode } from "react";
import type { ReactElement } from "react";
import { Item as HeadlessItem } from "@design-system/headless";
import type { ItemProps as HeadlessItemProps } from "@react-types/shared";

import type { IconProps } from "../../Icon";
import type { COLORS } from "../../../shared";
import type { ButtonProps } from "../../Button";

interface ItemProps<T> extends Omit<HeadlessItemProps<T>, "children"> {
  color?: keyof typeof COLORS;
  variant?: ButtonProps["variant"];
  icon?: IconProps["name"];
  iconPosition?: "start" | "end";
  isLoading?: boolean;
  isSeparator?: boolean;
  children?: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _Item<T>(props: ItemProps<T>): ReactElement | null {
  return null;
}

// Add types and decorate the method for the correct props work.
_Item.getCollectionNode = <T,>(props: ItemProps<T>) => {
  const { color, ...rest } = props;
  // @ts-expect-error this method is hidden by the types. See the source code of Item from Spectrum for more context.
  return HeadlessItem.getCollectionNode({
    ...rest,
    color,
    // TODO(pawan): Check why we need [data-color] here.
    ["data-color"]: Boolean(color) ? color : undefined,
  });
};

export const Item = _Item as <T>(props: ItemProps<T>) => JSX.Element;
