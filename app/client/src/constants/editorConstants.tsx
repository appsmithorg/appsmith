export type OccupiedSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
  parentId?: string;
};

export enum EDITOR_TABS {
  QUERY = "QUERY",
  SETTINGS = "SETTINGS",
}
