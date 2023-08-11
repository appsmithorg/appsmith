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
import log from "loglevel";

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
    debugger;
    updateActiveWalkthrough();
  };

  const popFeature = (triggeredFrom?: string) => {
    hideIndicator();
    const eventParams = activeWalkthrough?.eventParams || {};
    if (triggeredFrom) {
      eventParams.from = triggeredFrom;
    }
    AnalyticsUtil.logEvent("WALKTHROUGH_DISMISSED", eventParams);
    if (activeWalkthrough && activeWalkthrough.onDismiss) {
      activeWalkthrough.onDismiss();
    }
    setFeature((e) => {
      e.shift();
      return [...e];
    });
  };

  const updateActiveWalkthrough = () => {
    if (feature.length > 0) {
      const highlightArea = document.getElementById(feature[0].targetId);
      log.debug(highlightArea, "highlightArea");
      setActiveWalkthrough(null);
      if (highlightArea) {
        setTimeout(() => {
          setActiveWalkthrough(feature[0]);
        }, feature[0].delay || DEFAULT_DELAY);
      }
    } else {
      setActiveWalkthrough(null);
    }
  };

  useEffect(() => {
    log.debug(feature, "feature");
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
