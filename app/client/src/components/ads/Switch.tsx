import React from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";

const StyledSwitch = styled(Switch)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
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
