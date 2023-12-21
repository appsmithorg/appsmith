import React, { createContext, useMemo } from "react";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export enum ActionEntityContextMenuItemsEnum {
  EDIT_NAME = "Edit Name",
  SHOW_BINDING = "Show Bindings",
  COPY = "Copy",
  MOVE = "Move",
  DELETE = "Delete",
}

export const defaultMenuItems = [
  ActionEntityContextMenuItemsEnum.EDIT_NAME,
  ActionEntityContextMenuItemsEnum.DELETE,
  ActionEntityContextMenuItemsEnum.SHOW_BINDING,
  ActionEntityContextMenuItemsEnum.COPY,
  ActionEntityContextMenuItemsEnum.MOVE,
];

interface FilesContextContextProps {
  canCreateActions: boolean;
  editorId: string; // applicationId, workflowId or packageId
  menuItems?: ActionEntityContextMenuItemsEnum[];
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
  menuItems,
  parentEntityId,
  parentEntityType,
  selectFilesForExplorer,
  showModules,
}: FilesContextProviderProps) => {
  const value = useMemo(() => {
    return {
      canCreateActions,
      editorId,
      parentEntityId,
      parentEntityType,
      menuItems: menuItems || defaultMenuItems,
      selectFilesForExplorer,
      showModules,
    };
  }, [
    canCreateActions,
    parentEntityId,
    parentEntityType,
    menuItems,
    showModules,
    selectFilesForExplorer,
    editorId,
  ]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
