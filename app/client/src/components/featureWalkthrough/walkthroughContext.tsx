import React from "react";

export type PositionType = "top" | "bottom" | "left" | "right";

export type OffsetType = {
  // Position for the instructions and indicator
  position?: PositionType;
  // Adds an offset to top or bottom properties (of Instruction div) depending upon the position
  top?: number;
  // Adds an offset to left or right properties (of Instruction div) depending upon the position
  left?: number;
  // Style for the Instruction div overrides all other styles
  style?: any;
  // Indicator top and left offsets
  indicatorTop?: number;
  indicatorLeft?: number;
  // container offset for highlight
  highlightPad?: number;
};

export type FeatureDetails = {
  // Title to show on the instruction screen
  title: string;
  // Description to show on the instruction screen
  description: string;
  // Gif or Image to give a walkthrough
  imageURL?: string;
};

export type FeatureParams = {
  // To execute a function on dismissing the tutorial walkthrough.
  onDismiss?: () => void;
  // Target Id without # to highlight the feature
  targetId: string;
  // Details for the instruction screen
  details?: FeatureDetails;
  // Offsets for the instruction screen and the indicator
  offset?: OffsetType;
  // Event params
  eventParams?: Record<string, any>;
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
