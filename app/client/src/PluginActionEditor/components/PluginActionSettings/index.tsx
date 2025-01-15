import React from "react";
import { UIComponentTypes } from "entities/Plugin";
import { usePluginActionContext } from "../../PluginActionContext";
import ApiSettings from "./ApiSettings";
import QuerySettings from "./QuerySettings";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "ee/constants/forms";
import { DocsLink } from "constants/DocumentationLinks";

const API_FORM_COMPONENTS = [
  UIComponentTypes.ApiEditorForm,
  UIComponentTypes.GraphQLEditorForm,
];

const PluginActionSettings = () => {
  const { plugin } = usePluginActionContext();

  return API_FORM_COMPONENTS.includes(plugin.uiComponent) ? (
    <ApiSettings
      dataTestId="t--action-settings-trigger"
      formName={API_EDITOR_FORM_NAME}
    />
  ) : (
    <QuerySettings
      dataTestId="t--action-settings-trigger"
      docsLink={DocsLink.QUERY_SETTINGS}
      formName={QUERY_EDITOR_FORM_NAME}
    />
  );
};

export default PluginActionSettings;
