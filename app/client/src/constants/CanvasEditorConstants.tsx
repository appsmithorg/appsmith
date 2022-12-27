export type OccupiedSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
  parentId?: string;
};

export type WidgetSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
  type: string;
  parentId?: string;
  fixedHeight?: number;
};

export const zIndexLayers = {
  PROPERTY_PANE: "z-[3]",
  ENTITY_EXPLORER: "z-[3]",
  RESIZER: "z-[4]",
};

export type PaneConfig = {
  tabsPanelWidth: number;
  propertyPaneWidth: number;
  canvasPaneWidth: number;
};

export enum ScreenSize {
  SMALL = "SMALL", // smaller than 13 inch
  // MEDIUM = "MEDIUM", // 13 - 15 inch
  // LARGE = "LARGE", // 15 to 17 inch
  // EXTRA_LARGE = "EXTRA_LARGE", // more than 17 inch
}

export type ScreenSizePaneConfigType = Record<ScreenSize, PaneConfig>;

export const ScreenSizePaneConfig: ScreenSizePaneConfigType = {
  // EXTRA_LARGE: { max: undefined, min: undefined },
  // LARGE: { max: undefined, min: undefined },
  // MEDIUM: { max: undefined, min: undefined },
  [ScreenSize.SMALL]: {
    tabsPanelWidth: 4,
    propertyPaneWidth: 0,
    canvasPaneWidth: 6,
  },
};
