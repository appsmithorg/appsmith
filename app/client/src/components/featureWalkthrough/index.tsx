import React, { useState } from "react";
import type { FeatureParams } from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";
import { createPortal } from "react-dom";
import WalkthroughRenderer from "./walkthroughRenderer";

export default function Walkthrough({ children }: any) {
  const [feature, setFeature] = useState<FeatureParams | null>(null);
  const pushFeature = (value: FeatureParams) => {
    setFeature(value);
  };

  const popFeature = () => {
    setFeature(null);
  };

  return (
    <WalkthroughContext.Provider value={{ pushFeature, popFeature, feature }}>
      {children}
      {feature &&
        createPortal(<WalkthroughRenderer {...feature} />, document.body)}
    </WalkthroughContext.Provider>
  );
}
