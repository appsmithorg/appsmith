import React from "react";
import { PluginActionToolbar } from "PluginActionEditor";
import AppPluginActionMenu from "./PluginActionMoreActions";

const AppPluginActionToolbar = () => {
  return <PluginActionToolbar menuContent={<AppPluginActionMenu />} />;
};

export default AppPluginActionToolbar;
