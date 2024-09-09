import React from "react";
import {
  PluginActionEditor,
  PluginActionToolbar,
  PluginActionForm,
  PluginActionResponsePane,
} from "PluginActionEditor";

const WorkflowPluginActionEditor = () => {
  return (
    <PluginActionEditor>
      <PluginActionToolbar />
      <PluginActionForm />
      <PluginActionResponsePane />
    </PluginActionEditor>
  );
};

export default WorkflowPluginActionEditor;
