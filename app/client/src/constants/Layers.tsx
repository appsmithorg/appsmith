import React from "react";

export enum Indices {
  Layer0,
  Layer1,
  Layer2,
  Layer3,
  Layer4,
  Layer5,
  Layer6,
  Layer7,
  Layer8,
  Layer9,
  Layer21 = 21,
  LayerMax = 99999,
}

export const Layers = {
  dropZone: Indices.Layer0,

  dragPreview: Indices.Layer1,
  // All Widgets Parent layer
  positionedWidget: Indices.Layer1,
  // Modal needs to higher than other widgets.
  modalWidget: Indices.Layer2,
  // Dropdown portaled to the canvas
  dropdownWidget: Indices.Layer2,
  // dropdown portaled to Modal Container with higher index than Overlay
  dropdownModalWidget: Indices.Layer21,
  selectedWidget: Indices.Layer2,
  // Layers when dragging
  animatedSnappingDropZone: Indices.Layer2,

  animatedDropZone: Indices.Layer3,
  // Must be higher than any widget
  widgetName: Indices.Layer3,
  apiPane: Indices.Layer3,
  // Propane needs to match sidebar to show propane on top side bar.
  // Sidebar needs to be more than modal so that u can use side bar whilst u have the modal showing up on the canvas.
  sideBar: Indices.Layer3,
  propertyPane: Indices.Layer3,

  help: Indices.Layer4,
  dynamicAutoComplete: Indices.Layer5,
  debugger: Indices.Layer6,
  productUpdates: Indices.Layer7,
  portals: Indices.Layer8,
  header: Indices.Layer9,
  appComments: Indices.Layer9,
  max: Indices.LayerMax,
};

export const LayersContext = React.createContext(Layers);
