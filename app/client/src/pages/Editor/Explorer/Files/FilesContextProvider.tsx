import React, { createContext, useMemo } from "react";

interface FilesContextContextProps {
  canCreateActions: boolean;
  entityId: string; // page, workflow or module
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
  entityId,
}: FilesContextProviderProps) => {
  const value = useMemo(() => {
    return {
      canCreateActions,
      entityId,
    };
  }, [canCreateActions, entityId]);

  return (
    <FilesContext.Provider value={value}>{children}</FilesContext.Provider>
  );
};
