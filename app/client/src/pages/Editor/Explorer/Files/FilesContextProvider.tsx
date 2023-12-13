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
  parentEntityId: string; // page, workflow or module
  parentEntityType: ActionParentEntityTypeInterface;
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
  parentEntityId,
  parentEntityType,
}: FilesContextProviderProps) => {
  const menuItems = [
    ActionEntityContextMenuItemsEnum.EDIT_NAME,
    ActionEntityContextMenuItemsEnum.DELETE,
  ];
  if (parentEntityType === ACTION_PARENT_ENTITY_TYPE.PAGE) {
    menuItems.push(
      ActionEntityContextMenuItemsEnum.SHOW_BINDING,
      ActionEntityContextMenuItemsEnum.COPY,
      ActionEntityContextMenuItemsEnum.MOVE,
    );
  }
  const value = useMemo(() => {
    return {
      canCreateActions,
      parentEntityId,
      parentEntityType,
      menuItems,
    };
  }, [canCreateActions, parentEntityId, parentEntityType]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
