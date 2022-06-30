import React, { useCallback } from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import useDSEvent from "utils/hooks/useDSEvent";
import { DSEventTypes } from "utils/AppsmithUtils";

const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

export default function AdsSwitch(props: ISwitchProps) {
  const { dispatchDSEvent, eventEmitterRefCallback } = useDSEvent<
    HTMLDivElement
  >(true);

  const emitKeyboardAnalyticsEvent = useCallback(
    (key: string) => {
      dispatchDSEvent({
        component: "AdsSwitch",
        event: DSEventTypes.KEYBOARD_ANALYTICS,
        meta: {
          key,
        },
      });
    },
    [dispatchDSEvent],
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
