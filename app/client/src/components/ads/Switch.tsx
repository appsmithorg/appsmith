import React, { useRef } from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";

const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

export default function AdsSwitch(props: ISwitchProps) {
  const wrapperRef = useRef<HTMLInputElement>(null);
  const dispatchInteractionAnalyticsEvent = useInteractionAnalyticsEvent(
    wrapperRef,
  );
  const handleKeydown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        dispatchInteractionAnalyticsEvent({ key: e.key });
        break;
    }
  };

  return (
    <div ref={wrapperRef}>
      <StyledSwitch
        {...props}
        className={
          props.className
            ? props.className + " " + replayHighlightClass
            : replayHighlightClass
        }
        onKeyDown={handleKeydown}
        tabIndex={0}
      />
    </div>
  );
}
