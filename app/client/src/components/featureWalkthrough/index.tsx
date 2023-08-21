/* eslint-disable no-debugger */
import React, { lazy, useEffect, useState, Suspense } from "react";
import type { FeatureParams } from "./walkthroughContext";
import { DEFAULT_DELAY } from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";
import { createPortal } from "react-dom";
import { hideIndicator } from "pages/Editor/GuidedTour/utils";
import { retryPromise } from "utils/AppsmithUtils";
import { useLocation } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
    // debugger;
    updateActiveWalkthrough();
  };

  const popFeatureInit = (triggeredFrom?: string) => {
    hideIndicator();
    const eventParams = activeWalkthrough?.eventParams || {};
    if (triggeredFrom) {
      eventParams.from = triggeredFrom;
    }
    AnalyticsUtil.logEvent("WALKTHROUGH_DISMISSED", eventParams);
    if (activeWalkthrough && activeWalkthrough.onDismiss) {
      activeWalkthrough.onDismiss();
    }
  };

  const popFeature = (triggeredFrom?: string) => {
    popFeatureInit(triggeredFrom);

    setFeature((e) => {
      e.shift();
      return [...e];
    });
  };

  const popFeatureById = (id: string, triggeredFrom?: string) => {
    popFeatureInit(triggeredFrom);

    setFeature((features) => {
      return [...features.filter((feature) => feature.featureId === id)];
    });
  };

  const updateActiveWalkthrough = (id?: string) => {
    if (feature.length > 0) {
      const _feature = feature.find((e) => e.featureId === id) ?? feature[0];
      const highlightArea = document.querySelector(_feature.targetId);
      setActiveWalkthrough(null);
      if (highlightArea) {
        setTimeout(() => {
          setActiveWalkthrough(_feature);
        }, _feature.delay || DEFAULT_DELAY);
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
        popFeatureById,
        updateActiveWalkthrough,
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
