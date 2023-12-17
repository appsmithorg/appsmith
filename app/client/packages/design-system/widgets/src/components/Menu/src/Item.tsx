import { Item as HeadlessItem } from "@design-system/headless";

import type { ItemProps as HeadlessItemProps } from "@react-types/shared";
import type { ReactElement } from "react";
import type { COLORS } from "../../../shared";

interface ItemProps<T> extends HeadlessItemProps<T> {
  color?: keyof typeof COLORS;
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
    ["data-color"]: color,
    ...rest,
  });
};

export const Item = _Item as <T>(props: ItemProps<T>) => JSX.Element;
