import React from "react";

export type PositionType = "top" | "bottom" | "left" | "right";

export type OffsetType = {
  position?: PositionType;
  // Adds an offset to top or bottom properties (of Instruction div) depending upon the position
  top?: number;
  // Adds an offset to left or right properties (of Instruction div) depending upon the position
  left?: number;
  // Style for the Instruction div overrides all other styles
  style?: any;
  indicatorTop?: number;
  indicatorLeft?: number;
};

export type FeatureDetails = {
  title: string;
  description: string;
  imageURL?: string;
};

export type FeatureParams = {
  onDismiss?: () => void;
  targetId: string;
  details?: FeatureDetails;
  offset?: OffsetType;
};

type WalkthroughContextType = {
  pushFeature: (feature: FeatureParams) => void;
  popFeature: () => void;
  feature: FeatureParams[];
  isOpened: boolean;
};

const WalkthroughContext = React.createContext<
  WalkthroughContextType | undefined
>(undefined);

export default WalkthroughContext;
