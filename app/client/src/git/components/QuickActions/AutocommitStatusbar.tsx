import React, { useEffect, useRef, useState } from "react";
import { Statusbar } from "@appsmith/ads-old";
import styled from "styled-components";
import {
  AUTOCOMMIT_IN_PROGRESS_MESSAGE,
  createMessage,
} from "ee/constants/messages";

interface AutocommitStatusbarProps {
  completed: boolean;
  onHide?: () => void;
}

const PROGRESSBAR_WIDTH = 150;
const PROGRESS_INTERVAL = 4 * 1000; // in ms
const MAX_PROGRESS_PERCENTAGE = 90;
const PROGRESS_INCREMENT = 10;
const STEPS = 9;

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

export default function AutocommitStatusbar({
  completed,
  onHide,
}: AutocommitStatusbarProps) {
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
        }, PROGRESS_INTERVAL / STEPS);
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
  ); // Removed 'percentage' from dependencies

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
    <StatusbarWrapper data-testid="t--autocommit-statusbar">
      <Statusbar
        active={false}
        message={createMessage(AUTOCOMMIT_IN_PROGRESS_MESSAGE)}
        percentage={percentage}
        showOnlyMessage
      />
    </StatusbarWrapper>
  );
}
