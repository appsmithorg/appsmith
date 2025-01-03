import type { ListItemWithoutOnClick } from "./types";
import type { ListItemProps } from "@appsmith/ads";
import type { GenericEntityItem } from "ee/entities/IDE/constants";

export const enhanceItemForListItem = (
  item: ListItemWithoutOnClick,
  selectedItem: GenericEntityItem | undefined,
  setSelectedItem: (item: GenericEntityItem) => void,
): ListItemProps => {
  return {
    ...item,
    isSelected: selectedItem ? selectedItem.key === item.id : false,
    onClick: () =>
      setSelectedItem({
        key: item.id,
        title: item.title,
        icon: item.startIcon,
      }),
    size: "md",
  };
};
