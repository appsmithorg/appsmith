export * from "ce/pages/Editor/IDE/EditorPane/Query/ListItem";

import { QueryListItem as CE_QueryListItem } from "ce/pages/Editor/IDE/EditorPane/Query/ListItem";
import type { QueryListItemProps } from "ce/pages/Editor/IDE/EditorPane/Query/ListItem";

import React from "react";
import ExplorerModuleInstanceEntity from "@appsmith/pages/Editor/Explorer/ModuleInstanceEntity";

export const QueryListItem = (props: QueryListItemProps) => {
  const { isActive, item } = props;
  if (item.isModuleInstance) {
    return (
      <ExplorerModuleInstanceEntity
        id={item.key}
        isActive={isActive}
        searchKeyword={""}
        step={1}
      />
    );
  }
  return <CE_QueryListItem {...props} />;
};
