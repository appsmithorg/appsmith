import React, { createContext, useMemo } from "react";

type QueryEditorContextContextProps = {
  moreActionsMenu?: React.ReactNode;
  onCreateDatasourceClick?: () => void;
  onEntityNotFoundBackClick?: () => void;
  changeQueryPage?: (queryId: string) => void;
  showActionRightPaneBackLink?: boolean;
};

type QueryEditorContextProviderProps =
  React.PropsWithChildren<QueryEditorContextContextProps>;

export const QueryEditorContext = createContext<QueryEditorContextContextProps>(
  {} as QueryEditorContextContextProps,
);

export function QueryEditorContextProvider({
  changeQueryPage,
  children,
  moreActionsMenu,
  onCreateDatasourceClick,
  onEntityNotFoundBackClick,
}: QueryEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      moreActionsMenu,
      onCreateDatasourceClick,
      onEntityNotFoundBackClick,
      changeQueryPage,
    }),
    [
      moreActionsMenu,
      onCreateDatasourceClick,
      onEntityNotFoundBackClick,
      changeQueryPage,
    ],
  );

  return (
    <QueryEditorContext.Provider value={value}>
      {children}
    </QueryEditorContext.Provider>
  );
}
