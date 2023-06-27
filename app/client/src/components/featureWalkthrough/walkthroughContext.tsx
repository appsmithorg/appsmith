import React from "react";

export type PositionType = "top" | "bottom" | "left" | "right";

export type OffsetType = {
  position?: PositionType;
  top?: number;
  left?: number;
};

export type FeatureDetails = {
  title: string;
  description: string;
  imageURL?: string;
  imageThumnail?: string;
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
  feature: FeatureParams | null;
};

const WalkthroughContext = React.createContext<
  WalkthroughContextType | undefined
>(undefined);

export default WalkthroughContext;
