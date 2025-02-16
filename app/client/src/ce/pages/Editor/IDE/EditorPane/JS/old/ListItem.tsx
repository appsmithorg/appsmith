import React from "react";
import ExplorerJSCollectionEntity from "pages/Editor/Explorer/JSActions/JSActionEntity";
import { Flex } from "@appsmith/ads";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

export interface JSListItemProps {
  item: EntityItem;
  isActive: boolean;
  parentEntityId: string;
}

export const JSListItem = (props: JSListItemProps) => {
  const { isActive, item, parentEntityId } = props;

  return (
    <Flex data-testid="t--ide-list-item" flexDirection={"column"}>
      <ExplorerJSCollectionEntity
        baseCollectionId={item.key}
        isActive={isActive}
        key={item.key}
        parentEntityId={parentEntityId}
        searchKeyword={""}
        step={1}
      />
    </Flex>
  );
};
