import { OccupiedSpace } from "constants/CanvasEditorConstants";

export const HORIZONTAL_RESIZE_LIMIT = 2;
export const VERTICAL_RESIZE_LIMIT = 4;

export enum ReflowDirection {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  TOPLEFT = "TOP|LEFT",
  TOPRIGHT = "TOP|RIGHT",
  BOTTOMLEFT = "BOTTOM|LEFT",
  BOTTOMRIGHT = "BOTTOM|RIGHT",
  UNSET = "UNSET",
}

export enum SpaceAttributes {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
}

export enum MathComparators {
  min = "min",
  max = "max",
}

export type GridProps = {
  parentColumnSpace: number;
  parentRowSpace: number;
  maxGridColumns: number;
  paddingOffset?: number;
};

export type CollisionAccessors = {
  direction: SpaceAttributes;
  oppositeDirection: SpaceAttributes;
  perpendicularMax: SpaceAttributes;
  perpendicularMin: SpaceAttributes;
  parallelMax: SpaceAttributes;
  parallelMin: SpaceAttributes;
  mathComparator: MathComparators;
  directionIndicator: 1 | -1;
  isHorizontal: boolean;
};

export type Delta = {
  X: number;
  Y: number;
};

export type CollidingSpace = OccupiedSpace & {
  direction: ReflowDirection;
};

export type CollidingSpaceMap = {
  [key: string]: CollidingSpace;
};

export type CollisionTree = OccupiedSpace & {
  children?: {
    [key: string]: CollisionTree;
  };
};

export type SpaceMovement = {
  id?: string;
  directionalMovements: DirectionalMovement[];
};

export type DirectionalMovement = {
  maxMovement: number;
  directionalIndicator: 1 | -1;
  coordinateKey: "X" | "Y";
  isHorizontal: boolean;
};

export type ReflowedSpace = {
  X?: number;
  Y?: number;
  width?: number;
  height?: number;
  depth?: number;
  x?: number;
  y?: number;
  maxX?: number;
  maxY?: number;
  dimensionXBeforeCollision?: number;
  dimensionYBeforeCollision?: number;
  maxOccupiedSpace?: number;
  emptySpaces?: number;
};

export type ReflowedSpaceMap = {
  [key: string]: ReflowedSpace;
};
