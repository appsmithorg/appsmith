export interface TreeNode {
  aboves: string[];
  belows: string[];
  topRow: number;
  bottomRow: number;
  originalTopRow: number;
  originalBottomRow: number;
  distanceToNearestAbove: number;
}

export interface NodeSpace {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
}

export const MAX_BOX_SIZE = 20000;
