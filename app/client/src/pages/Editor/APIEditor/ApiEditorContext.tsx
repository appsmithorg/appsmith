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
  closeEditorLink?: React.ReactNode;
}

type ApiEditorContextProviderProps =
  React.PropsWithChildren<ApiEditorContextContextProps>;

export const ApiEditorContext = createContext<ApiEditorContextContextProps>(
  {} as ApiEditorContextContextProps,
);

export function ApiEditorContextProvider({
  actionRightPaneBackLink,
  children,
  closeEditorLink,
  handleDeleteClick,
  handleRunClick,
  moreActionsMenu,
  saveActionName,
  settingsConfig,
}: ApiEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      actionRightPaneBackLink,
      closeEditorLink,
      handleDeleteClick,
      handleRunClick,
      moreActionsMenu,
      saveActionName,
      settingsConfig,
    }),
    [
      actionRightPaneBackLink,
      closeEditorLink,
      handleDeleteClick,
      handleRunClick,
      moreActionsMenu,
      saveActionName,
      settingsConfig,
    ],
  );

  return (
    <ApiEditorContext.Provider value={value}>
      {children}
    </ApiEditorContext.Provider>
  );
}
