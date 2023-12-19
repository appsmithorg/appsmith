import React, { createContext, useMemo } from "react";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";
import { ACTION_PARENT_ENTITY_TYPE } from "@appsmith/entities/Engine/actionHelpers";

export enum ActionEntityContextMenuItemsEnum {
  EDIT_NAME = "Edit Name",
  SHOW_BINDING = "Show Bindings",
  COPY = "Copy",
  MOVE = "Move",
  DELETE = "Delete",
}

interface FilesContextContextProps {
  canCreateActions: boolean;
  editorId: string; // applicationId, workflowId or packageId
  parentEntityId: string; // page, workflow or module
  parentEntityType: ActionParentEntityTypeInterface;
  showModules?: boolean;
  selectFilesForExplorer?: (state: any) => any;
}

type FilesContextProviderProps =
  React.PropsWithChildren<FilesContextContextProps>;

interface MenuItemsType {
  menuItems: ActionEntityContextMenuItemsEnum[];
}

// Create a context for the files with actions and parent entity details
export const FilesContext = createContext<
  FilesContextContextProps & MenuItemsType
>({} as FilesContextContextProps & MenuItemsType);

// Create a context provider component
export const FilesContextProvider = ({
  canCreateActions,
  children,
  editorId,
  parentEntityId,
  parentEntityType,
  selectFilesForExplorer,
  showModules,
}: FilesContextProviderProps) => {
  const menuItems = useMemo(() => {
    const items = [
      ActionEntityContextMenuItemsEnum.EDIT_NAME,
      ActionEntityContextMenuItemsEnum.DELETE,
    ];
    if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
      items.push(
        ActionEntityContextMenuItemsEnum.SHOW_BINDING,
        ActionEntityContextMenuItemsEnum.COPY,
        ActionEntityContextMenuItemsEnum.MOVE,
      );
    }
    return items;
  }, [parentEntityType]);

  const value = useMemo(() => {
    return {
      canCreateActions,
      editorId,
      parentEntityId,
      parentEntityType,
      menuItems,
      selectFilesForExplorer,
      showModules,
    };
  }, [
    canCreateActions,
    parentEntityId,
    parentEntityType,
    showModules,
    selectFilesForExplorer,
    editorId,
  ]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
