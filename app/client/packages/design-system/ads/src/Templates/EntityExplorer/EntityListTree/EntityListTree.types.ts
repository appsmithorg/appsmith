export interface EntityListTreeItem {
  children?: EntityListTreeItem[];
  isExpanded: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
  id: string;
  name: string;
  type: string;
}

export interface EntityListTreeProps {
  depth?: number;
  items: EntityListTreeItem[];
  ItemComponent: React.ComponentType<{ item: EntityListTreeItem }>;
  onItemExpand: (id: string) => void;
}
