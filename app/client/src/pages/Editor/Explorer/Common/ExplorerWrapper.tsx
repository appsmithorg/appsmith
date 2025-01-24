import React from "react";
import { tailwindLayers } from "constants/Layers";

export const ExplorerWrapper = (props: { children: React.ReactNode }) => (
  <div
    className={`flex-1 flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
  >
    {props.children}
  </div>
);
