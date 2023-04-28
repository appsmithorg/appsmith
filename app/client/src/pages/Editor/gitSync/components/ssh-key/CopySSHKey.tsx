import { TooltipWrapper } from "./StyledComponents";
import { COPY_SSH_KEY, createMessage } from "@appsmith/constants/messages";
import React from "react";
import { Button, Icon, Tooltip } from "design-system";

function getCopiedSuccessIcon() {
  return (
    <Icon color="var(--ads-v2-color-fg-success)" name="check-line" size="md" />
  );
}

function getToCopyIcon(copyToClipboard: () => void) {
  return (
    <TooltipWrapper>
      <Tooltip content={createMessage(COPY_SSH_KEY)}>
        <Button
          className="t--copy-ssh-key"
          isIconButton
          kind="tertiary"
          onClick={copyToClipboard}
          size="sm"
          startIcon="duplicate"
        />
      </Tooltip>
    </TooltipWrapper>
  );
}

export function CopySSHKey(showCopied: boolean, copyToClipboard: () => void) {
  return showCopied ? getCopiedSuccessIcon() : getToCopyIcon(copyToClipboard);
}
