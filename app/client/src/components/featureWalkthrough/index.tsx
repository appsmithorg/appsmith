import React, { lazy, useEffect, useState, Suspense } from "react";
import type { FeatureParams } from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";
import { createPortal } from "react-dom";
import { hideIndicator } from "pages/Editor/GuidedTour/utils";
import { retryPromise } from "utils/AppsmithUtils";
import { useLocation } from "react-router-dom";

const WalkthroughRenderer = lazy(() => {
  return retryPromise(
    () =>
      import(
        /* webpackChunkName: "walkthrough-renderer" */ "./walkthroughRenderer"
      ),
  );
});

const LoadingFallback = () => null;

export default function Walkthrough({ children }: any) {
  const [activeWalkthrough, setActiveWalkthrough] =
    useState<FeatureParams | null>();
  const [feature, setFeature] = useState<FeatureParams[]>([]);
  const location = useLocation();

  const pushFeature = (value: FeatureParams) => {
    const alreadyExists = feature.some((f) => f.targetId === value.targetId);
    if (!alreadyExists) {
      if (Array.isArray(value)) {
        setFeature((e) => [...e, ...value]);
      } else {
        setFeature((e) => [...e, value]);
      }
    }
    updateActiveWalkthrough();
  };

  const popFeature = () => {
    hideIndicator();
    setFeature((e) => {
      e.shift();
      return [...e];
    });
  };

  const updateActiveWalkthrough = () => {
    if (feature.length > 0) {
      const highlightArea = document.querySelector(`#${feature[0].targetId}`);
      if (highlightArea) {
        setActiveWalkthrough(feature[0]);
      } else {
        setActiveWalkthrough(null);
      }
    } else {
      setActiveWalkthrough(null);
    }
  };

  useEffect(() => {
    if (feature.length > -1) updateActiveWalkthrough();
  }, [feature.length, location]);

  return (
    <WalkthroughContext.Provider
      value={{
        pushFeature,
        popFeature,
        feature,
        isOpened: !!activeWalkthrough,
      }}
    >
      {children}
      {activeWalkthrough &&
        createPortal(
          <Suspense fallback={<LoadingFallback />}>
            <WalkthroughRenderer {...activeWalkthrough} />
          </Suspense>,
          document.body,
        )}
    </WalkthroughContext.Provider>
  );
}
