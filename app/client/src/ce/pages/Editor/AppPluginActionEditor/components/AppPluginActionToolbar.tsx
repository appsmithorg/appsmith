import React from "react";
import { PluginActionToolbar } from "PluginActionEditor";
import { ToolbarMenu } from "./ToolbarMenu";

const AppPluginActionToolbar = () => {
  return <PluginActionToolbar menuContent={<ToolbarMenu />} />;
};

export default AppPluginActionToolbar;
