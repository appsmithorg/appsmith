import { showSignpostingModal } from "actions/onboardingActions";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { Layers } from "constants/Layers";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getIsFirstTimeUserOnboardingEnabled,
  getSignpostingSetOverlay,
} from "selectors/onboardingSelectors";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

const StyledOverlay = styled.div`
  z-index: ${Layers.signpostingOverlay};
  opacity: 0.6;
  background-color: transparent;
  animation: fade-in 1s forwards;
  will-change: background-color;
  @keyframes fade-in {
    from {
      background-color: transparent;
    }
    to {
      background-color: var(--ads-v2-color-bg-emphasis-max);
    }
  }
`;

function Overlay() {
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const setOverlay = useSelector(getSignpostingSetOverlay);
  const dispatch = useDispatch();
  const showStarterTemplatesInsteadofBlankCanvas = useFeatureFlag(
    FEATURE_FLAG.ab_show_templates_instead_of_blank_canvas_enabled,
  );

  if (
    !showStarterTemplatesInsteadofBlankCanvas &&
    signpostingEnabled &&
    setOverlay
  ) {
    return (
      <StyledOverlay
        className="fixed top-0 w-full h-full overflow-hidden"
        onClick={() => {
          dispatch(showSignpostingModal(false));
        }}
      />
    );
  }

  return null;
}

export default Overlay;
