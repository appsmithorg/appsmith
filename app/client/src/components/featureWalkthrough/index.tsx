import React, { lazy, useEffect, useState, Suspense } from "react";
import type { FeatureParams } from "./walkthroughContext";
import { DEFAULT_DELAY } from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";
import { createPortal } from "react-dom";
import { retryPromise } from "utils/AppsmithUtils";
import { useLocation } from "react-router-dom";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isElementVisible } from "./utils";
import { hideIndicator } from "components/utils/Indicator";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";

const WalkthroughRenderer = lazy(async () => {
  return retryPromise(
    async () =>
      import(
        /* webpackChunkName: "walkthrough-renderer" */ "./walkthroughRenderer"
      ),
  );
});

const LoadingFallback = () => null;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Walkthrough({ children }: any) {
  const [activeWalkthrough, setActiveWalkthrough] =
    useState<FeatureParams | null>();
  const [feature, setFeature] = useState<FeatureParams[]>([]);
  const location = useLocation();

  const isWalkthroughDisabled = useSelector((state: AppState) =>
    selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.rollout_remove_feature_walkthrough_enabled,
    ),
  );

  const pushFeature = (value: FeatureParams, prioritize = false) => {
    if (!isWalkthroughDisabled || !!value?.forceExecution) {
      const alreadyExists = feature.some((f) => f.targetId === value.targetId);
      if (!alreadyExists) {
        const _value = Array.isArray(value) ? [...value] : [value];
        if (prioritize) {
          // Get ahead of the queue
          setFeature((e) => [..._value, ...e]);
        } else {
          setFeature((e) => [...e, ..._value]);
        }
      }
      updateActiveWalkthrough();
    }
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
    setActiveWalkthrough(null);
  };

  const updateActiveWalkthrough = () => {
    // If a walkthrough is active we do not want to reset it
    if (activeWalkthrough) return;

    if (feature.length > 0) {
      const highlightArea = document.querySelector(feature[0].targetId);
      if (highlightArea) {
        setTimeout(() => {
          if (isElementVisible(highlightArea as HTMLElement)) {
            if (typeof feature[0].runBeforeWalkthrough === "function") {
              feature[0].runBeforeWalkthrough();
            }
            setActiveWalkthrough(feature[0]);
          }
        }, feature[0].delay || DEFAULT_DELAY);
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
