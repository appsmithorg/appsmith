import { KeyValueViewProps } from "../types";
import { ControlWrapper } from "../../../propertyControls/StyledControls";
import { KeyValueComponent } from "../../../propertyControls/KeyValueComponent";
import { DropdownOption } from "../../../constants";
import React from "react";

export function KeyValueView(props: KeyValueViewProps) {
  return (
    <ControlWrapper isAction key={props.label}>
      <KeyValueComponent
        addLabel={"Query Params"}
        pairs={props.get(props.value, false) as DropdownOption[]}
        updatePairs={(pageParams: DropdownOption[]) => props.set(pageParams)}
      />
    </ControlWrapper>
  );
}
