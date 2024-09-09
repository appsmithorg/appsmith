import React from "react";
import {
  PluginActionEditor,
  PluginActionToolbar,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";

const ModulePluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <PluginActionToolbar />
      <PluginActionForm />
      <PluginActionResponsePane />
    </PluginActionEditor>
  );
};

export default ModulePluginActionEditor;
