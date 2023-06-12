import React from "react";
import { MenuContent } from "design-system";
import styled from "styled-components";
import Checklist from "./Checklist2";

const SIGNPOSTING_POPUP_WIDTH = "360px";

const StyledMenuContent = styled(MenuContent)`
  max-width: ${SIGNPOSTING_POPUP_WIDTH};
`;

function OnboardingModal() {
  return (
    <StyledMenuContent width={SIGNPOSTING_POPUP_WIDTH}>
      <Checklist />
    </StyledMenuContent>
  );
}

export default OnboardingModal;
