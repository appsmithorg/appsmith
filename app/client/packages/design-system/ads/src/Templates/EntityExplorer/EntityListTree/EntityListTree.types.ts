import type { EntityItemProps } from "../EntityItem/EntityItem.types";

export interface EntityListTreeItem extends EntityItemProps {
  children?: EntityListTreeItem[];
  isExpanded: boolean;
}

export interface EntityListTreeProps {
  depth?: number;
  items: EntityListTreeItem[];
  onItemExpand: (id: string) => void;
}
