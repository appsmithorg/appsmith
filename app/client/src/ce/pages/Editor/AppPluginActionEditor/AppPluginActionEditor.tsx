import React from "react";
import {
  PluginActionEditor,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";
import {
  ConvertToModuleDisabler,
  ConvertToModuleCallout,
} from "./components/ConvertToModule";
import AppPluginActionToolbar from "./components/AppPluginActionToolbar";

const AppPluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <ConvertToModuleDisabler>
        <AppPluginActionToolbar />
        <ConvertToModuleCallout />
        <PluginActionForm />
        <PluginActionResponsePane />
      </ConvertToModuleDisabler>
    </PluginActionEditor>
  );
};

export default AppPluginActionEditor;
