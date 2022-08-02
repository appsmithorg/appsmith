import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { TooltipWrapper } from "./StyledComponents";
import { TooltipComponent } from "design-system";
import { COPY_SSH_KEY, createMessage } from "@appsmith/constants/messages";
import React from "react";

function getCopiedSuccessIcon() {
  return (
    <Icon
      fillColor={Colors.GREEN}
      hoverFillColor={Colors.GREEN}
      name="check-line"
      size={IconSize.XXXL}
    />
  );
}

function getToCopyIcon(copyToClipboard: () => void) {
  return (
    <TooltipWrapper>
      <TooltipComponent content={createMessage(COPY_SSH_KEY)}>
        <Icon
          className="t--copy-ssh-key"
          fillColor={Colors.DARK_GRAY}
          hoverFillColor={Colors.GRAY2}
          name="duplicate"
          onClick={copyToClipboard}
          size={IconSize.XXXL}
        />
      </TooltipComponent>
    </TooltipWrapper>
  );
}

export function CopySSHKey(showCopied: boolean, copyToClipboard: () => void) {
  return showCopied ? getCopiedSuccessIcon() : getToCopyIcon(copyToClipboard);
}
