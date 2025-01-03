import type { ListItemProps } from "@appsmith/ads";

export interface GroupedItems {
  group: string;
  items: ListItemProps[];
}

export interface ListItemWithoutOnClick extends Omit<ListItemProps, "onClick"> {
  id: string;
}

export type GetGroupHookType = () => {
  group: string;
  items: ListItemWithoutOnClick[];
};
