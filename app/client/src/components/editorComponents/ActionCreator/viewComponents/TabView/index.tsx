import type { TabViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { Switcher } from "design-system-old";
import React from "react";

export function TabView(props: TabViewProps) {
  return (
    <FieldWrapper className="tab-view">
      <ControlWrapper>
        {props.label && (
          <label className="!text-gray-600 !text-xs" data-testid="tabs-label">
            {props.label}
          </label>
        )}
        <Switcher activeObj={props.activeObj} switches={props.switches} />
      </ControlWrapper>
    </FieldWrapper>
  );
}
