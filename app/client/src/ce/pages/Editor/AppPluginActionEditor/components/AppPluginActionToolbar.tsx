import React from "react";
import { PluginActionToolbar } from "PluginActionEditor";
import ConvertToModuleCTA from "./ConvertToModuleCTA";

const AppPluginActionToolbar = () => {
  return <PluginActionToolbar menuContent={<ConvertToModuleCTA />} />;
};

export default AppPluginActionToolbar;
