import React from "react";
import {
  PluginActionEditor,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";
import ConvertToModuleCallout from "./components/ConvertToModuleCallout";
import AppPluginActionToolbar from "./components/AppPluginActionToolbar";

const AppPluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <AppPluginActionToolbar />
      <ConvertToModuleCallout />
      <PluginActionForm />
      <PluginActionResponsePane />
    </PluginActionEditor>
  );
};

export default AppPluginActionEditor;
