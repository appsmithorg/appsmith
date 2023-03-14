export type TreeNode = {
  aboves: string[];
  belows: string[];
  topRow: number;
  bottomRow: number;
  originalTopRow: number;
  originalBottomRow: number;
  distanceToNearestAbove: number;
};

export type NodeSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
};

export const MAX_BOX_SIZE = 20000;
