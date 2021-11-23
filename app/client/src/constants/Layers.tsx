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
  Layer10,
  Layer21 = 21,
  LayerMax = 99999,
}

export const Layers = {
  dropZone: Indices.Layer0,

  dragPreview: Indices.Layer1,
  // All Widgets Parent layer
  positionedWidget: Indices.Layer1,
  // Modal needs to higher than other widgets.
  modalWidget: Indices.Layer3,
  // Dropdown portaled to the canvas
  dropdownWidget: Indices.Layer2,
  // dropdown portaled to Modal Container with higher index than Overlay
  dropdownModalWidget: Indices.Layer21,
  selectedWidget: Indices.Layer2,
  // Layers when dragging
  animatedSnappingDropZone: Indices.Layer2,

  focusedWidget: Indices.Layer3,
  animatedDropZone: Indices.Layer3,
  // Must be higher than any widget
  widgetName: Indices.Layer3,
  apiPane: Indices.Layer3,
  // Propane needs to match sidebar to show propane on top side bar.
  // Sidebar needs to be more than modal so that u can use side bar whilst u have the modal showing up on the canvas.
  sideBar: Indices.Layer3,
  propertyPane: Indices.Layer3,
  tableFilterPane: Indices.Layer6,

  help: Indices.Layer4,
  contextMenu: Indices.Layer4,
  dynamicAutoComplete: Indices.Layer5,
  debugger: Indices.Layer6,
  bottomBar: Indices.Layer6,
  productUpdates: Indices.Layer7,
  portals: Indices.Layer9,
  header: Indices.Layer9,
  snipeableZone: Indices.Layer10,
  appComments: Indices.Layer7,
  max: Indices.LayerMax,
  sideStickyBar: Indices.Layer7,
  evaluationPopper: Indices.Layer3,
  concurrentEditorWarning: Indices.Layer2,
};

export const tailwindLayers = {
  propertyPane: "z-3",
  entityExplorer: "z-3",
  resizer: "z-4",
  appComments: "z-7",
};

export const LayersContext = React.createContext(Layers);
