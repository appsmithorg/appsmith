import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { PaginationField } from "api/ActionAPI";
import React, { createContext, useMemo } from "react";
import type { SaveActionNameParams } from "PluginActionEditor";

interface ApiEditorContextContextProps {
  moreActionsMenu?: React.ReactNode;
  handleRunClick: (paginationField?: PaginationField) => void;
  actionRightPaneBackLink?: React.ReactNode;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingsConfig: any;
  saveActionName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
  showRightPaneTabbedSection?: boolean;
  actionRightPaneAdditionSections?: React.ReactNode;
  notification?: React.ReactNode | string;
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
  handleRunClick,
  moreActionsMenu,
  notification,
  saveActionName,
  settingsConfig,
  showRightPaneTabbedSection,
}: ApiEditorContextProviderProps) {
  const value = useMemo(
    () => ({
      actionRightPaneAdditionSections,
      actionRightPaneBackLink,
      showRightPaneTabbedSection,
      handleRunClick,
      moreActionsMenu,
      saveActionName,
      settingsConfig,
      notification,
    }),
    [
      actionRightPaneBackLink,
      actionRightPaneAdditionSections,
      showRightPaneTabbedSection,
      handleRunClick,
      moreActionsMenu,
      saveActionName,
      settingsConfig,
      notification,
    ],
  );

  /* @ts-expect-error: Types are not available */
  if (typeof window.Cypress?.log === "function") {
    /* @ts-expect-error: Types are not available */
    window.Cypress.log({
      message: `ApiEditorContextProvider, ${JSON.stringify(settingsConfig || {})} ${JSON.stringify(value.settingsConfig || {})}`,
    });
  }

  return (
    <ApiEditorContext.Provider value={value}>
      {children}
    </ApiEditorContext.Provider>
  );
}
