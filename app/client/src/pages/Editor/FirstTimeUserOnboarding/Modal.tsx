import React from "react";
import { MenuContent } from "@appsmith/ads";
import styled from "styled-components";
import Checklist from "./Checklist";
import HelpMenu from "./HelpMenu";
import { useDispatch } from "react-redux";
import { showSignpostingModal } from "actions/onboardingActions";

const SIGNPOSTING_POPUP_WIDTH = "360px";

const StyledMenuContent = styled(MenuContent)<{ animate: boolean }>`
  max-width: ${SIGNPOSTING_POPUP_WIDTH};
  overflow: hidden;
  display: flex;
  animation-name: slideUpAndFade;
  @keyframes slideUpAndFade {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
const Wrapper = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-5);
  display: flex;
  flex-direction: column;
`;

function OnboardingModal(props: {
  setOverlay: boolean;
  showIntercomConsent: boolean;
  setShowIntercomConsent: (val: boolean) => void;
}) {
  const dispatch = useDispatch();

  return (
    <StyledMenuContent
      animate={props.setOverlay}
      collisionPadding={10}
      data-testid="signposting-modal"
      onInteractOutside={() => {
        dispatch(showSignpostingModal(false));
      }}
      width={SIGNPOSTING_POPUP_WIDTH}
    >
      <Wrapper>
        {!props.showIntercomConsent && <Checklist />}
        <HelpMenu
          setShowIntercomConsent={props.setShowIntercomConsent}
          showIntercomConsent={props.showIntercomConsent}
        />
      </Wrapper>
    </StyledMenuContent>
  );
}

export default OnboardingModal;
