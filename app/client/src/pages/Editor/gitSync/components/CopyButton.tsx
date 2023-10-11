import React, { useRef, useState } from "react";
import { Button, Icon, Tooltip } from "design-system";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import noop from "lodash/noop";

export const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const IconContainer = styled.div``;

interface CopyButtonProps {
  value?: string;
  delay?: number;
  onCopy?: () => void;
  tooltipMessage?: string;
  isDisabled?: boolean;
}

export function CopyButton({
  delay = 2000,
  isDisabled = false,
  onCopy = noop,
  tooltipMessage,
  value,
}: CopyButtonProps) {
  const timerRef = useRef<number>();
  const [showCopied, setShowCopied] = useState(false);

  const stopShowingCopiedAfterDelay = () => {
    timerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, delay);
  };
  const copyToClipboard = () => {
    if (value) {
      copy(value);
      setShowCopied(true);
      stopShowingCopiedAfterDelay();
    }
    onCopy();
  };

  return (
    <>
      {showCopied ? (
        <IconContainer>
          <Icon
            color="var(--ads-v2-color-fg-success)"
            name="check-line"
            size="lg"
          />
        </IconContainer>
      ) : (
        <TooltipWrapper>
          <Tooltip content={tooltipMessage}>
            <Button
              className="t--copy-ssh-key"
              isDisabled={isDisabled}
              isIconButton
              kind="tertiary"
              onClick={copyToClipboard}
              size="sm"
              startIcon="duplicate"
            />
          </Tooltip>
        </TooltipWrapper>
      )}{" "}
    </>
  );
}
