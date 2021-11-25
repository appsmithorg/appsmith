import React from "react";
import styled from "constants/DefaultTheme";
import { ISwitchProps, Switch } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

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
        props.className ? props.className + " ur--has-border" : "ur--has-border"
      }
    />
  );
}
