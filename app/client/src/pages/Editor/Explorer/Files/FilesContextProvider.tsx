import React, { createContext, useMemo } from "react";
import type { ACTION_PARENT_ENTITY_TYPE } from "actions/apiPaneActions";

interface FilesContextContextProps {
  canCreateActions: boolean;
  parentEntityId: string; // page, workflow or module
  parentEntityType: ACTION_PARENT_ENTITY_TYPE;
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
