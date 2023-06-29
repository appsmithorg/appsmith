import React, { lazy, useState } from "react";
import type { FeatureParams } from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";
import { createPortal } from "react-dom";
import { hideIndicator } from "pages/Editor/GuidedTour/utils";
import { retryPromise } from "utils/AppsmithUtils";

const WalkthroughRenderer = lazy(() => {
  return retryPromise(
    () =>
      import(
        /* webpackChunkName: "walkthrough-renderer" */ "./walkthroughRenderer"
      ),
  );
});

export default function Walkthrough({ children }: any) {
  const [feature, setFeature] = useState<FeatureParams[]>([]);
  const pushFeature = (value: FeatureParams) => {
    if (Array.isArray(value)) {
      setFeature((e) => [...e, ...value]);
    } else {
      setFeature((e) => [...e, value]);
    }
  };

  const popFeature = () => {
    hideIndicator();
    setFeature((e) => {
      e.shift();
      return [...e];
    });
  };

  return (
    <WalkthroughContext.Provider
      value={{ pushFeature, popFeature, feature, isOpened: feature.length > 0 }}
    >
      {children}
      {feature.length > 0 &&
        createPortal(<WalkthroughRenderer {...feature[0]} />, document.body)}
    </WalkthroughContext.Provider>
  );
}
