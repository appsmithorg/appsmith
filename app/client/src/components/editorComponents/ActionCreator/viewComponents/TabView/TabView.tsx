import { TabViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "../../../../propertyControls/StyledControls";
import { Switcher } from "design-system";
import React from "react";

export function TabView(props: TabViewProps) {
  return (
    <FieldWrapper>
      <ControlWrapper>
        {props.label && <label data-testid="tabs-label">{props.label}</label>}
        <Switcher activeObj={props.activeObj} switches={props.switches} />
      </ControlWrapper>
    </FieldWrapper>
  );
}
