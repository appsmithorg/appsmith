import React, { createContext, useMemo } from "react";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

interface FilesContextContextProps {
  canCreateActions: boolean;
  parentEntityId: string; // page, workflow or module
  parentEntityType: ActionParentEntityTypeInterface;
}

type FilesContextProviderProps =
  React.PropsWithChildren<FilesContextContextProps>;

// Create a context for the pageId
export const FilesContext = createContext<FilesContextContextProps>(
  {} as FilesContextContextProps,
);

// Create a context provider component
export const FilesContextProvider = ({
  canCreateActions,
  children,
  parentEntityId,
  parentEntityType,
}: FilesContextProviderProps) => {
  const value = useMemo(() => {
    return {
      canCreateActions,
      parentEntityId,
      parentEntityType,
    };
  }, [canCreateActions, parentEntityId, parentEntityType]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
