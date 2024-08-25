import React from "react";

export type PositionType = "top" | "bottom" | "left" | "right";

export const DEFAULT_DELAY = 0;

export interface OffsetType {
  // Position for the instructions and indicator
  position?: PositionType;
  // Adds an offset to top or bottom properties (of Instruction div) depending upon the position
  top?: number;
  // Adds an offset to left or right properties (of Instruction div) depending upon the position
  left?: number;
  // Style for the Instruction div overrides all other styles
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  // Indicator top and left offsets
  indicatorTop?: number;
  indicatorLeft?: number;
  // container offset for highlight
  highlightPad?: number;
}

export interface FeatureDetails {
  // Title to show on the instruction screen
  title: string;
  // Description to show on the instruction screen
  description: string;
  // Gif or Image to give a walkthrough
  imageURL?: string;
  // footer details
  footerDetails?: FeatureFooterDetails;
}

export interface FeatureFooterDetails {
  // footer text
  footerText: string;
  // footer button text
  footerButtonText: string;
  // footer button onClick handler
  onClickHandler: () => void;
}

export const isFeatureFooterDetails = (
  obj: FeatureFooterDetails,
): obj is FeatureFooterDetails => {
  return !!obj;
};

export interface FeatureParams {
  // To execute a function on dismissing the tutorial walkthrough.
  onDismiss?: () => void;
  // Target Id without # to highlight the feature
  targetId: string;
  // Details for the instruction screen
  details?: FeatureDetails;
  // Offsets for the instruction screen and the indicator
  offset?: OffsetType;
  // Event params
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventParams?: Record<string, any>;
  // Walkthrough delay in ms
  delay?: number;
  // Multiple Highlights -> multiple ids for highlighter, if not present considers targetId as the only highlighting div.
  multipleHighlights?: string[];
  // Overlay color
  overlayColor?: string;
  // Close popup when clicking on the overlay
  dismissOnOverlayClick?: boolean;
  // execute function just before showing walkthrough highlight
  runBeforeWalkthrough?: () => void;
  // If we want to force the display of walkthrough, set this prop to true
  // If set to true, will override the feature flag as well
  forceExecution?: boolean;
}

interface WalkthroughContextType {
  pushFeature: (feature: FeatureParams, prioritize?: boolean) => void;
  popFeature: (triggeredFrom?: string) => void;
  feature: FeatureParams[];
  isOpened: boolean;
}

const WalkthroughContext = React.createContext<
  WalkthroughContextType | undefined
>(undefined);

export default WalkthroughContext;
