import type { ListItemWithoutOnClick } from "./types";
import type { ListItemProps } from "@appsmith/ads";

export const enhanceItemForListItem = (
  item: ListItemWithoutOnClick,
  selectedItemId: string | undefined,
  setSelectedItem: (itemId: string) => void,
): ListItemProps => {
  return {
    ...item,
    isSelected: selectedItemId ? selectedItemId === item.id : false,
    onClick: () => setSelectedItem(item.id as string),
    size: "md",
  };
};
