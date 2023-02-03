import { tailwindLayers } from "constants/Layers";
import React from "react";
import EntityExplorer from "./EntityExplorer";
import { Colors } from "constants/Colors";

function ExplorerContent() {
  return (
    <div
      className={`flex-1 border-t border-[${Colors.GREY_2}] flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
    >
      <EntityExplorer isActive />
    </div>
  );
}

export default ExplorerContent;
