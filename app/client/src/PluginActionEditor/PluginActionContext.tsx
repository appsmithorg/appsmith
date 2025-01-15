import React, {
  type ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import type { Action } from "entities/Action";
import type { Plugin } from "entities/Plugin";
import type { Datasource, EmbeddedRestDatasource } from "entities/Datasource";
import type { ActionResponse } from "api/ActionAPI";

interface PluginActionContextType {
  action: Action;
  actionResponse?: ActionResponse;
  editorConfig?: unknown[];
  settingsConfig?: unknown[];
  plugin: Plugin;
  datasource?: EmbeddedRestDatasource | Datasource;
}

// No need to export this context to use it. Use the hook defined below instead
const PluginActionContext = createContext<PluginActionContextType | null>(null);

interface ChildrenProps {
  children: ReactNode | ReactNode[];
}

export const PluginActionContextProvider = (
  props: ChildrenProps & PluginActionContextType,
) => {
  const {
    action,
    actionResponse,
    children,
    datasource,
    editorConfig,
    plugin,
    settingsConfig,
  } = props;

  // using useMemo to avoid unnecessary renders
  const contextValue = useMemo(
    () => ({
      action,
      actionResponse,
      datasource,
      editorConfig,
      plugin,
      settingsConfig,
    }),
    [action, actionResponse, datasource, editorConfig, plugin, settingsConfig],
  );

  return (
    <PluginActionContext.Provider value={contextValue}>
      {children}
    </PluginActionContext.Provider>
  );
};

// By using this hook, you are guaranteed that the states are correctly
// typed and set.
// Without this, consumers of the context would need to keep doing a null check
export const usePluginActionContext = () => {
  const context = useContext(PluginActionContext);

  if (!context) {
    throw new Error(
      "usePluginActionContext must be used within usePluginActionContextProvider",
    );
  }

  return context;
};
