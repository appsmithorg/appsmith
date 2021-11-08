export type OccupiedSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
  parentId?: string;
};

export const zIndexLayers = {
  RESIZER: "z-4",
  PROPERTY_PANE: "z-3",
  ENTITY_EXPLORER: "z-3",
};
