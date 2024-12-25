import React, { useEffect, useRef, useState } from "react";
import { Statusbar as ADSStatusBar } from "@appsmith/ads-old";
import styled from "styled-components";

interface StatusbarProps {
  message?: string;
  completed: boolean;
  onHide?: () => void;
  className?: string;
  testId?: string;
}

const PROGRESSBAR_WIDTH = 150;
const TOTAL_DURATION_MS = 4000; // in ms
const MAX_PROGRESS_PERCENTAGE = 90;
const PROGRESS_INCREMENT = 10;
const STEPS = 9;
const INTERVAL_MS = TOTAL_DURATION_MS / STEPS;

const StatusbarWrapper = styled.div`
  > div {
    display: flex;
    height: initial;
    align-items: center;
  }

  > div > div {
    margin-top: 0px;
    width: ${PROGRESSBAR_WIDTH}px;
    margin-right: var(--ads-v2-spaces-4);
  }

  > div > p {
    margin-top: 0;
  }
`;

export default function Statusbar({
  completed,
  message,
  onHide,
}: StatusbarProps) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [percentage, setPercentage] = useState(0);

  // Effect for incrementing percentage when not completed
  useEffect(
    function incrementPercentage() {
      if (!completed) {
        intervalRef.current = setInterval(() => {
          setPercentage((prevPercentage) => {
            if (prevPercentage < MAX_PROGRESS_PERCENTAGE) {
              return prevPercentage + PROGRESS_INCREMENT;
            } else {
              // Clear the interval when percentage reaches 90%
              if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              return prevPercentage;
            }
          });
        }, INTERVAL_MS);
      }

      // Cleanup function to clear the interval
      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    },
    [completed],
  );

  // Effect for setting percentage to 100% when completed
  useEffect(
    function finishPercentage() {
      if (completed) {
        setPercentage(100);
      }
    },
    [completed],
  );

  // Effect for calling onHide after 1 second when completed
  useEffect(
    function onCompleteCallback() {
      if (completed && onHide) {
        timeoutRef.current = setTimeout(() => {
          onHide();
        }, 1000);
      }

      return () => {
        if (timeoutRef.current !== null) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    },
    [completed, onHide],
  );

  return (
    <StatusbarWrapper>
      <ADSStatusBar
        active={false}
        message={message}
        percentage={percentage}
        showOnlyMessage
      />
    </StatusbarWrapper>
  );
}
