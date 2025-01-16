import type { CSSProperties } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import noop from "lodash/noop";
import log from "loglevel";

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

function CopyButton({
  delay = 2000,
  isDisabled = false,
  onCopy = noop,
  style,
  testIdSuffix = "generic",
  tooltipMessage,
  value,
}: CopyButtonProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [showCopied, setShowCopied] = useState(false);

  useEffect(function clearShowCopiedTimeout() {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const stopShowingCopiedAfterDelay = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setShowCopied(false);
    }, delay);
  }, [delay]);

  const copyToClipboard = useCallback(() => {
    if (value) {
      try {
        const success = copy(value);

        if (success) {
          setShowCopied(true);
          stopShowingCopiedAfterDelay();
          onCopy();
        }
      } catch (error) {
        log.error("Failed to copy to clipboard:", error);
      }
    }
  }, [onCopy, stopShowingCopiedAfterDelay, value]);

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
              aria-label={`Copy ${tooltipMessage || "text"}`}
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

export default CopyButton;
