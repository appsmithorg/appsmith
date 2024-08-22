import type { CSSProperties } from "react";
import React, { useRef, useState } from "react";

import copy from "copy-to-clipboard";
import noop from "lodash/noop";
import styled from "styled-components";

import { Button, Icon, Tooltip } from "@appsmith/ads";

export const TooltipWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const IconContainer = styled.div``;

interface CopyButtonProps {
  style?: CSSProperties;
  value?: string;
  delay?: number;
  onCopy?: () => void;
  tooltipMessage?: string;
  isDisabled?: boolean;
  testIdSuffix?: string;
}

export function CopyButton({
  delay = 2000,
  isDisabled = false,
  onCopy = noop,
  style,
  testIdSuffix = "generic",
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
        <IconContainer style={style}>
          <Icon
            color="var(--ads-v2-color-fg-success)"
            name="check-line"
            size="lg"
          />
        </IconContainer>
      ) : (
        <TooltipWrapper style={style}>
          <Tooltip content={tooltipMessage}>
            <Button
              data-testid={`t--copy-${testIdSuffix}`}
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
