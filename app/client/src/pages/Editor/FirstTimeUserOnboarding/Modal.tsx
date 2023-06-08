import React from "react";
import { MenuContent, Text, Button, Divider } from "design-system";
import {
  ONBOARDING_CHECKLIST_HEADER,
  SIGNPOSTING_POPUP_SUBTITLE,
  createMessage,
} from "@appsmith/constants/messages";
import styled from "styled-components";

const SIGNPOSTING_POPUP_WIDTH = "360px";

const Wrapper = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-5);
`;

const StyledMenuContent = styled(MenuContent)`
  max-width: ${SIGNPOSTING_POPUP_WIDTH};
`;

function OnboardingModal() {
  const completedTasks = 0;

  return (
    <StyledMenuContent width={SIGNPOSTING_POPUP_WIDTH}>
      <Wrapper>
        <div className="flex justify-between pb-4">
          <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-m">
            {createMessage(ONBOARDING_CHECKLIST_HEADER)}
          </Text>
          {/* TODO: size looks small */}
          <Button isIconButton kind="tertiary" startIcon={"close-line"} />
        </div>
        <Text color="var(--ads-v2-color-bg-brand-secondary)" kind="heading-xs">
          {createMessage(SIGNPOSTING_POPUP_SUBTITLE)}
        </Text>
        <div className="mt-5">
          <Text
            color="var(--ads-v2-color-bg-brand-secondary)"
            kind="heading-xs"
          >
            {completedTasks} of 5{" "}
          </Text>
          <Text>complete</Text>
        </div>
        <Divider />
      </Wrapper>
    </StyledMenuContent>
  );
}

export default OnboardingModal;
