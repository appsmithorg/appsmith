import React, { createContext, useMemo } from "react";

interface FilesContextContextProps {
  canCreateActions: boolean;
  parentEntityId: string; // page, workflow or module
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
}: FilesContextProviderProps) => {
  const value = useMemo(() => {
    return {
      canCreateActions,
      parentEntityId,
    };
  }, [canCreateActions, parentEntityId]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
