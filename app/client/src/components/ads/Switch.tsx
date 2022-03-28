import React from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

export default function AdsSwitch(props: ISwitchProps) {
  return (
    <StyledSwitch
      {...props}
      className={
        props.className
          ? props.className + " " + replayHighlightClass
          : replayHighlightClass
      }
    />
  );
}
