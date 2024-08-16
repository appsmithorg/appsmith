import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import React, { createContext, useMemo } from "react";

interface SaveActionNameParams {
  id: string;
  name: string;
}

interface QueryEditorContextContextProps {
  moreActionsMenu?: React.ReactNode;
  onCreateDatasourceClick?: () => void;
  onEntityNotFoundBackClick?: () => void;
  changeQueryPage?: (baseQueryId: string) => void;
  actionRightPaneBackLink?: React.ReactNode;
  saveActionName?: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
  closeEditorLink?: React.ReactNode;
  actionRightPaneAdditionSections?: React.ReactNode;
  showSuggestedWidgets?: boolean;
  notification?: string | React.ReactNode;
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
  notification,
  onCreateDatasourceClick,
  onEntityNotFoundBackClick,
  saveActionName,
  showSuggestedWidgets,
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
      showSuggestedWidgets,
      notification,
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
      showSuggestedWidgets,
      notification,
    ],
  );

  return (
    <QueryEditorContext.Provider value={value}>
      {children}
    </QueryEditorContext.Provider>
  );
}
