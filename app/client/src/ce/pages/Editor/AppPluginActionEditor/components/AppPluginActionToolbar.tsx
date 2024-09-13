import React from "react";
import { PluginActionToolbar } from "PluginActionEditor";
import { ConvertToModuleCTA } from "./ConvertToModule";

const AppPluginActionToolbar = () => {
  return <PluginActionToolbar menuContent={<ConvertToModuleCTA />} />;
};

export default AppPluginActionToolbar;
