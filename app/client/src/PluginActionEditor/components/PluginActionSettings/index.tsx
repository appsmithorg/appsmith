import React from "react";
import { UIComponentTypes } from "api/PluginApi";
import { usePluginActionContext } from "../../PluginActionContext";
import ApiSettings from "./ApiSettings";
import QuerySettings from "./QuerySettings";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "ee/constants/forms";

const API_FORM_COMPONENTS = [
  UIComponentTypes.ApiEditorForm,
  UIComponentTypes.GraphQLEditorForm,
];

const PluginActionSettings = () => {
  const { plugin } = usePluginActionContext();

  return API_FORM_COMPONENTS.includes(plugin.uiComponent) ? (
    <ApiSettings formName={API_EDITOR_FORM_NAME} />
  ) : (
    <QuerySettings formName={QUERY_EDITOR_FORM_NAME} />
  );
};

export default PluginActionSettings;
