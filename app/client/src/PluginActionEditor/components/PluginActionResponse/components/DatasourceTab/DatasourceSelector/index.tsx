import React from "react";
import { UIComponentTypes, type Plugin } from "api/PluginApi";
import ApiDatasourceSelector from "./ApiDatasourceSelector";
import QueryDatasourceSelector from "./QueryDatasourceSelector";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "ee/constants/forms";

const API_FORM_COMPONENTS = [
  UIComponentTypes.ApiEditorForm,
  UIComponentTypes.GraphQLEditorForm,
];

export interface DatasourceProps {
  datasourceId: string;
  datasourceName: string;
  plugin?: Plugin;
}

const DatasourceSelector = (props: DatasourceProps) => {
  return props.plugin &&
    API_FORM_COMPONENTS.includes(props.plugin.uiComponent) ? (
    <ApiDatasourceSelector {...props} formName={API_EDITOR_FORM_NAME} />
  ) : (
    <QueryDatasourceSelector {...props} formName={QUERY_EDITOR_FORM_NAME} />
  );
};

export default DatasourceSelector;
