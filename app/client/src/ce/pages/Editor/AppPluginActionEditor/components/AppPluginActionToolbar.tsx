import React from "react";
import { PluginActionToolbar } from "PluginActionEditor";
import { ConvertToModuleCTA } from "./ConvertToModule";
import AppPluginActionMenu from "./PluginActionMoreActions";

const AppPluginActionToolbar = () => {
  return (
    <PluginActionToolbar
      menuContent={
        <>
          <ConvertToModuleCTA />
          <AppPluginActionMenu />
        </>
      }
    />
  );
};

export default AppPluginActionToolbar;
