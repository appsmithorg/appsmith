import { showSignpostingModal } from "actions/onboardingActions";
import { Layers } from "constants/Layers";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFirstTimeUserOnboardingModal,
  getIsFirstTimeUserOnboardingEnabled,
  getSignpostingSetOverlay,
} from "selectors/onboardingSelectors";
import styled from "styled-components";

const StyledOverlay = styled.div`
  background-color: var(--ads-v2-color-bg-emphasis-max);
  z-index: ${Layers.signpostingOverlay};
  opacity: 0.6;
`;

function Overlay() {
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const setOverlay = useSelector(getSignpostingSetOverlay);
  const isSignpostingModalOpen = useSelector(getFirstTimeUserOnboardingModal);
  const dispatch = useDispatch();

  if (isSignpostingModalOpen && signpostingEnabled && setOverlay) {
    return (
      <StyledOverlay
        className="fixed top-0 w-full h-full overflow-hidden signposting-overlay z-[9]"
        onClick={() => {
          dispatch(showSignpostingModal(false));
        }}
      />
    );
  }

  return null;
}

export default Overlay;
