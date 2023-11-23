import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import React, { createContext, useMemo } from "react";

interface SaveActionNameParams {
  id: string;
  name: string;
}

interface QueryEditorContextContextProps {
  moreActionsMenu?: React.ReactNode;
  onCreateDatasourceClick?: () => void;
  onEntityNotFoundBackClick?: () => void;
  changeQueryPage?: (queryId: string) => void;
  actionRightPaneBackLink?: React.ReactNode;
  saveActionName?: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
  closeEditorLink?: React.ReactNode;
  actionRightPaneAdditionSections?: React.ReactNode;
}

type QueryEditorContextProviderProps =
  React.PropsWithChildren<QueryEditorContextContextProps>;

export const QueryEditorContext = createContext<QueryEditorContextContextProps>(
  {} as QueryEditorContextContextProps,
);

export function QueryEditorContextProvider({
  actionRightPaneAdditionSections,
  actionRightPaneBackLink,
  changeQueryPage,
  children,
  closeEditorLink,
  moreActionsMenu,
  onCreateDatasourceClick,
  onEntityNotFoundBackClick,
  saveActionName,
}: QueryEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      actionRightPaneBackLink,
      actionRightPaneAdditionSections,
      changeQueryPage,
      closeEditorLink,
      moreActionsMenu,
      onCreateDatasourceClick,
      onEntityNotFoundBackClick,
      saveActionName,
    }),
    [
      actionRightPaneBackLink,
      actionRightPaneAdditionSections,
      changeQueryPage,
      closeEditorLink,
      moreActionsMenu,
      onCreateDatasourceClick,
      onEntityNotFoundBackClick,
      saveActionName,
    ],
  );

  return (
    <QueryEditorContext.Provider value={value}>
      {children}
    </QueryEditorContext.Provider>
  );
}
