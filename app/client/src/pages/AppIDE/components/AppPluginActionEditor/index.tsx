import React from "react";
import {
  PluginActionEditor,
  PluginActionForm,
  PluginActionResponse,
} from "PluginActionEditor";
import {
  ConvertToModuleDisabler,
  ConvertToModuleCallout,
} from "./components/ConvertToModule";
import AppPluginActionToolbar from "./components/AppPluginActionToolbar";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";

const AppPluginActionEditor = () => {
  const { pathname } = useLocation();
  const entity = identifyEntityFromPath(pathname);

  return (
    <PluginActionEditor actionId={entity.id}>
      <ConvertToModuleDisabler>
        <AppPluginActionToolbar />
        <ConvertToModuleCallout />
        <PluginActionForm />
        <PluginActionResponse />
      </ConvertToModuleDisabler>
    </PluginActionEditor>
  );
};

export default AppPluginActionEditor;
