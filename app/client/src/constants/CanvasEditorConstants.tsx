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
};

export const zIndexLayers = {
  PROPERTY_PANE: "z-3",
  ENTITY_EXPLORER: "z-3",
  RESIZER: "z-4",
  APP_COMMENTS: "z-7",
};
