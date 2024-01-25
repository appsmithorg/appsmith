export * from "ce/pages/Editor/IDE/EditorPane/JS/ListItem";

import { JSListItem as CE_JSListItem } from "ce/pages/Editor/IDE/EditorPane/JS/ListItem";
import type { JSListItemProps } from "ce/pages/Editor/IDE/EditorPane/JS/ListItem";

import React from "react";
import ExplorerModuleInstanceEntity from "@appsmith/pages/Editor/Explorer/ModuleInstanceEntity";

export const JSListItem = (props: JSListItemProps) => {
  const { isActive, item } = props;
  if (item.isModuleInstance) {
    return (
      <ExplorerModuleInstanceEntity
        id={item.key}
        isActive={isActive}
        key={item.key}
        searchKeyword={""}
        step={1}
      />
    );
  }
  return <CE_JSListItem {...props} />;
};
