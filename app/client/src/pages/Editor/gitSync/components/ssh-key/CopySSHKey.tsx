import { TooltipWrapper } from "./StyledComponents";
import { TooltipComponent } from "design-system-old";
import { COPY_SSH_KEY, createMessage } from "@appsmith/constants/messages";
import React from "react";
import { Button, Icon } from "design-system";

function getCopiedSuccessIcon() {
  return (
    <Icon color="var(--ads-v2-color-fg-success)" name="check-line" size="lg" />
  );
}

function getToCopyIcon(copyToClipboard: () => void) {
  return (
    <TooltipWrapper>
      <TooltipComponent content={createMessage(COPY_SSH_KEY)}>
        <Button
          className="t--copy-ssh-key"
          isIconButton
          kind="tertiary"
          onClick={copyToClipboard}
          size="sm"
          startIcon="duplicate"
        />
      </TooltipComponent>
    </TooltipWrapper>
  );
}

export function CopySSHKey(showCopied: boolean, copyToClipboard: () => void) {
  return showCopied ? getCopiedSuccessIcon() : getToCopyIcon(copyToClipboard);
}
