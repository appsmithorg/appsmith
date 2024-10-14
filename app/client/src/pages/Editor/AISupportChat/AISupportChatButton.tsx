import React, { useState } from "react";

import { useSelector } from "react-redux";
import { Button, Tooltip } from "@appsmith/ads";
import {
  getFirstTimeUserOnboardingModal,
  getIsFirstTimeUserOnboardingEnabled,
  getSignpostingTooltipVisible,
} from "selectors/onboardingSelectors";
import { ChatComponent } from "./ChatComponent";

export function AISupportChatButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const showSignpostingTooltip = useSelector(getSignpostingTooltipVisible);
  const onboardingModalOpen = useSelector(getFirstTimeUserOnboardingModal);
  const tooltipProps = isFirstTimeUserOnboardingEnabled
    ? {
        visible: showTooltip || showSignpostingTooltip,
        onVisibleChange: setShowTooltip,
      }
    : {};

  const [showChat, setShowChat] = useState(false);

  return (
    <div className="relative">
      <Tooltip
        align={{
          targetOffset: [5, 0],
        }}
        content={"Chat with Appsmith AI Assistant"}
        destroyTooltipOnHide={isFirstTimeUserOnboardingEnabled}
        isDisabled={onboardingModalOpen}
        mouseLeaveDelay={0}
        placement="bottomRight"
        {...tooltipProps}
      >
        <Button
          data-testid="t--help-button"
          kind="tertiary"
          onClick={() => setShowChat(true)}
          size="md"
          startIcon="chat-help"
        >
          Chat
        </Button>
      </Tooltip>
      {showChat && <ChatComponent onClose={() => setShowChat(false)} />}
    </div>
  );
}
