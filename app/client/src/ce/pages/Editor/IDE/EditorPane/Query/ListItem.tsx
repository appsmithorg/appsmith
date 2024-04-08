import React from "react";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import ExplorerActionEntity from "pages/Editor/Explorer/Actions/ActionEntity";
import type { EntityItem } from "@appsmith/entities/IDE/constants";

export interface QueryListItemProps {
  item: EntityItem;
  isActive: boolean;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
}

export const QueryListItem = (props: QueryListItemProps) => {
  const { isActive, item, parentEntityId, parentEntityType } = props;
  return (
    <ExplorerActionEntity
      id={item.key}
      isActive={isActive}
      key={item.key}
      parentEntityId={parentEntityId}
      parentEntityType={parentEntityType}
      searchKeyword={""}
      step={1}
      type={item.type}
    />
  );
};
