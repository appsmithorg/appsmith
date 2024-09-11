import React from "react";
import {
  PluginActionEditor,
  PluginActionToolbar,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";
import ConvertToModuleCallout from "./components/ConvertToModuleCallout";

const AppPluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <PluginActionToolbar />
      <ConvertToModuleCallout />
      <PluginActionForm />
      <PluginActionResponsePane />
    </PluginActionEditor>
  );
};

export default AppPluginActionEditor;
