import React, { createContext, useMemo } from "react";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export enum ActionEntityContextMenuItemsEnum {
  EDIT_NAME = "Edit Name",
  SHOW_BINDING = "Show Bindings",
  CONVERT_QUERY_MODULE_INSTANCE = "Create Module",
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
  ActionEntityContextMenuItemsEnum.CONVERT_QUERY_MODULE_INSTANCE,
];

interface FilesContextContextProps {
  canCreateActions: boolean;
  editorId: string; // applicationId, workflowId or packageId
  menuItems?: ActionEntityContextMenuItemsEnum[];
  parentEntityId: string; // page, workflow or module
  parentEntityType: ActionParentEntityTypeInterface;
  showModules?: boolean;
  showWorkflows?: boolean;
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
  showWorkflows,
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
      showWorkflows,
    };
  }, [
    canCreateActions,
    parentEntityId,
    parentEntityType,
    menuItems,
    showModules,
    showWorkflows,
    selectFilesForExplorer,
    editorId,
  ]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
