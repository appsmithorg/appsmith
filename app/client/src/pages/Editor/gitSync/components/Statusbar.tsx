import React, { useEffect, useState } from "react";
import Statusbar from "components/ads/Statusbar";
import styled from "styled-components";

type StatusbarProps = {
  completed: boolean;
  message?: string;
  period: number; // as seconds
  onHide?: () => void;
};

export const StatusbarWrapper = styled.div`
  width: 252px;
  height: 38px;
`;

export default function GitSyncStatusbar(props: StatusbarProps) {
  const { completed, message, period } = props;
  const [percentage, setPercentage] = useState(0);
  useEffect(() => {
    if (completed) {
      setPercentage(100);
      if (props.onHide) {
        setTimeout(() => {
          props.onHide && props.onHide();
        }, 1000);
      }
    } else {
      if (percentage < 90) {
        const interval = setInterval(() => {
          setPercentage((percentage) => percentage + 10);
        }, (period * 1000) / 9);
        return () => clearInterval(interval);
      }
    }
  });
  return (
    <Statusbar
      active={false}
      message={message}
      percentage={percentage}
      showOnlyMessage
    />
  );
}
