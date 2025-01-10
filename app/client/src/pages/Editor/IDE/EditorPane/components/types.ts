import type { ListItemProps, FlexProps } from "@appsmith/ads";

export interface GroupedListProps {
  groupTitle?: string;
  className: string;
  items: ListItemProps[];
}

export interface GroupProps {
  group: GroupedListProps;
}

export interface SegmentAddHeaderProps {
  titleMessage: () => string;
  onCloseClick?: () => void;
}

export interface GroupedListComponentProps {
  groups: GroupedListProps[];
  flexProps?: FlexProps;
}
