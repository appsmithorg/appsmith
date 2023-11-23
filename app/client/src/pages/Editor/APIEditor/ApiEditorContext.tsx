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
  showRightPaneTabbedSection?: boolean;
  actionRightPaneAdditionSections?: React.ReactNode;
}

type ApiEditorContextProviderProps =
  React.PropsWithChildren<ApiEditorContextContextProps>;

export const ApiEditorContext = createContext<ApiEditorContextContextProps>(
  {} as ApiEditorContextContextProps,
);

export function ApiEditorContextProvider({
  actionRightPaneAdditionSections,
  actionRightPaneBackLink,
  children,
  closeEditorLink,
  handleDeleteClick,
  handleRunClick,
  moreActionsMenu,
  saveActionName,
  settingsConfig,
  showRightPaneTabbedSection,
}: ApiEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      actionRightPaneAdditionSections,
      actionRightPaneBackLink,
      closeEditorLink,
      handleDeleteClick,
      showRightPaneTabbedSection,
      handleRunClick,
      moreActionsMenu,
      saveActionName,
      settingsConfig,
    }),
    [
      actionRightPaneBackLink,
      actionRightPaneAdditionSections,
      closeEditorLink,
      handleDeleteClick,
      showRightPaneTabbedSection,
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
