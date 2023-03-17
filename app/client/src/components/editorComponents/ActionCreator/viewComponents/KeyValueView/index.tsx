import type { KeyValueViewProps } from "../../types";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import type { DropdownOption } from "../../../../constants";
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
