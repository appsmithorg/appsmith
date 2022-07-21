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
  const { emitDSEvent, eventEmitterRefCallback } = useDSEvent<HTMLDivElement>(
    true,
  );

  const emitKeyPressEvent = useCallback(
    (key: string) => {
      emitDSEvent({
        component: "AdsSwitch",
        event: DSEventTypes.KEYPRESS,
        meta: {
          key,
        },
      });
    },
    [emitDSEvent],
  );

  const handleKeydown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        emitKeyPressEvent(e.key);
        break;
      case "Tab":
        emitKeyPressEvent(`${e.shiftKey ? "Shift+" : ""}${e.key}`);
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
