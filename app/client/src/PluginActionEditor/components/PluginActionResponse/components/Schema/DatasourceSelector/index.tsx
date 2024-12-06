import React from "react";
import { UIComponentTypes } from "api/PluginApi";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import ApiDatasourceSelector from "./ApiDatasourceSelector";
import QueryDatasourceSelector from "./QueryDatasourceSelector";

const API_FORM_COMPONENTS = [
  UIComponentTypes.ApiEditorForm,
  UIComponentTypes.GraphQLEditorForm,
];

export interface DatasourceProps {
  datasourceId: string;
  datasourceName: string;
}

const DatasourceSelector = (props: DatasourceProps) => {
  const { plugin } = usePluginActionContext();

  return API_FORM_COMPONENTS.includes(plugin.uiComponent) ? (
    <ApiDatasourceSelector {...props} />
  ) : (
    <QueryDatasourceSelector {...props} />
  );
};

export default DatasourceSelector;
