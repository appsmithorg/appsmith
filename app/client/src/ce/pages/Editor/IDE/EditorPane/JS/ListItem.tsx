import React from "react";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import { Flex } from "design-system";
import type { EntityItem } from "@appsmith/entities/IDE/constants";

export interface JSListItemProps {
  item: EntityItem;
  isActive: boolean;
  parentEntityId: string;
  parentEntityType: ActionParentEntityTypeInterface;
}

export const JSListItem = (props: JSListItemProps) => {
  const { isActive, item, parentEntityId, parentEntityType } = props;
  return (
    <Flex data-testid="t--ide-list-item" flexDirection={"column"}>
      <ExplorerJSCollectionEntity
        id={item.key}
        isActive={isActive}
        key={item.key}
        parentEntityId={parentEntityId}
        parentEntityType={parentEntityType}
        searchKeyword={""}
        step={1}
        type={item.type}
      />
    </Flex>
  );
};
