import React from "react";
import { MenuContent } from "design-system";
import styled from "styled-components";
import Checklist from "./Checklist";
import HelpMenu from "./HelpMenu";

const SIGNPOSTING_POPUP_WIDTH = "360px";

const StyledMenuContent = styled(MenuContent)`
  max-width: ${SIGNPOSTING_POPUP_WIDTH};
`;
const Wrapper = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-5);
`;

function OnboardingModal(props: {
  showIntercomConsent: boolean;
  setShowIntercomConsent: (val: boolean) => void;
}) {
  return (
    <StyledMenuContent collisionPadding={10} width={SIGNPOSTING_POPUP_WIDTH}>
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
