export type TreeNode = {
  aboves: string[];
  belows: string[];
  topRow: number;
  bottomRow: number;
  originalTopRow: number;
  originalBottomRow: number;
};

export type NodeSpace = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  id: string;
};
