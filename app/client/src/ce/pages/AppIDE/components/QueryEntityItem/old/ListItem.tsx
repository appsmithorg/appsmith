import React from "react";
import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export interface QueryListItemProps {
  item: EntityItem;
  isActive: boolean;
  parentEntityId: string;
}

export const QueryListItem = (props: QueryListItemProps) => {
  const { isActive, item, parentEntityId } = props;

  return (
    <ExplorerActionEntity
      baseId={item.key}
      isActive={isActive}
      key={item.key}
      parentEntityId={parentEntityId}
      searchKeyword={""}
      step={1}
      type={item.type}
    />
  );
};
