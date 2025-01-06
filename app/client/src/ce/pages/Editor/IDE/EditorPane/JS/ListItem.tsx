import React from "react";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import { Flex } from "@appsmith/ads";
import type { EntityItem } from "ee/entities/IDE/constants";

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
        baseCollectionId={item.key}
        isActive={isActive}
        key={item.key}
        parentEntityId={parentEntityId}
        parentEntityType={parentEntityType}
        searchKeyword={""}
        step={1}
      />
    </Flex>
  );
};
