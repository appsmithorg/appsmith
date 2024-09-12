import React from "react";
import {
  PluginActionEditor,
  PluginActionToolbar,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";

const AppPluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <PluginActionToolbar />
      <PluginActionForm />
      <PluginActionResponsePane />
    </PluginActionEditor>
  );
};

export default AppPluginActionEditor;
