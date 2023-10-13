import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { PaginationField } from "api/ActionAPI";
import React, { createContext, useMemo } from "react";

interface SaveActionNameParams {
  id: string;
  name: string;
}

interface ApiEditorContextContextProps {
  moreActionsMenu?: React.ReactNode;
  handleDeleteClick: () => void;
  handleRunClick: (paginationField?: PaginationField) => void;
  actionRightPaneBackLink?: React.ReactNode;
  settingsConfig: any;
  saveActionName?: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

type ApiEditorContextProviderProps =
  React.PropsWithChildren<ApiEditorContextContextProps>;

export const ApiEditorContext = createContext<ApiEditorContextContextProps>(
  {} as ApiEditorContextContextProps,
);

export function ApiEditorContextProvider({
  actionRightPaneBackLink,
  children,
  handleDeleteClick,
  handleRunClick,
  moreActionsMenu,
  saveActionName,
  settingsConfig,
}: ApiEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      handleDeleteClick,
      handleRunClick,
      moreActionsMenu,
      settingsConfig,
      saveActionName,
      actionRightPaneBackLink,
    }),
    [
      handleDeleteClick,
      handleRunClick,
      moreActionsMenu,
      settingsConfig,
      saveActionName,
      actionRightPaneBackLink,
    ],
  );

  return (
    <ApiEditorContext.Provider value={value}>
      {children}
    </ApiEditorContext.Provider>
  );
}
