import useGitFeatureFlags from "git/hooks/useGitFeatureFlags";
import React from "react";
import ContinuousDeliveryCE from "./ContinuousDeliveryCE";
import { ContinuousDeliveryEE } from "ee/git/components/ContinuousDelivery/ContinuousDeliveryEE";

function ContinuousDelivery() {
  const { license_git_continuous_delivery_enabled } = useGitFeatureFlags();

  if (license_git_continuous_delivery_enabled) {
    return <ContinuousDeliveryEE />;
  }

  return <ContinuousDeliveryCE />;
}

export default ContinuousDelivery;
