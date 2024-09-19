import React, { useEffect, useState } from "react";
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

const StatusbarWrapper = styled.div`
  > div {
    display: flex;
    height: initial;
    align-items: center;
  }

  > div > div {
    margin-top: 0px;
    width: 150px;
    margin-right: 12px;
  }

  > div > p {
    margin-top: 0;
  }
`;

export default function AutocommitStatusbar({
  completed,
  onHide,
}: AutocommitStatusbarProps) {
  const period = 4;
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    if (completed) {
      setPercentage(100);

      if (onHide) {
        const timeout = setTimeout(() => {
          onHide && onHide();
        }, 1000);

        return () => clearTimeout(timeout);
      }
    } else {
      if (percentage < 90) {
        const interval = setInterval(
          () => {
            setPercentage((percentage) => percentage + 10);
          },
          (period * 1000) / 9,
        );

        return () => clearInterval(interval);
      }
    }
  });

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
