import React, { useCallback } from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import useAdsEvent from "utils/hooks/useAdsEvent";
import { ADSEventTypes } from "utils/AppsmithUtils";

const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

export default function AdsSwitch(props: ISwitchProps) {
  const { dispatchAdsEvent, eventEmitterRefCallback } = useAdsEvent<
    HTMLDivElement
  >(true);

  const emitKeyboardAnalyticsEvent = useCallback(
    (key: string) => {
      dispatchAdsEvent({
        component: "AdsSwitch",
        event: ADSEventTypes.KEYBOARD_ANALYTICS,
        meta: {
          key,
        },
      });
    },
    [dispatchAdsEvent],
  );

  const handleKeydown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        emitKeyboardAnalyticsEvent(e.key);
        break;
      case "Tab":
        emitKeyboardAnalyticsEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
        break;
    }
  };

  return (
    <StyledSwitch
      {...props}
      className={
        props.className
          ? props.className + " " + replayHighlightClass
          : replayHighlightClass
      }
      inputRef={eventEmitterRefCallback}
      onKeyDown={handleKeydown}
      tabIndex={0}
    />
  );
}
