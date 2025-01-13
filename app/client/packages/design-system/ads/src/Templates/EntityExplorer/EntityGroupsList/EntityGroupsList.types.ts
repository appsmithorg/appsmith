import type { MouseEvent, ReactNode } from "react";
import type { FlexProps } from "../../../Flex";
export interface EntityGroupProps<T> {
  groupTitle: string;
  className: string;
  items: T[];
  addConfig?: {
    icon: ReactNode;
    title: string;
    onClick: (e: MouseEvent) => void;
  };
  renderList?: (item: T) => React.ReactNode;
}

export interface EntityGroupsListProps<T> {
  groups: EntityGroupProps<T>[];
  flexProps?: FlexProps;
  showDivider?: boolean;
  visibleItems?: number;
}
