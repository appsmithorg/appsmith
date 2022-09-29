import { SelectorViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "../../../../propertyControls/StyledControls";
import { Setter, TreeDropdown } from "design-system";
import { PopoverPosition } from "@blueprintjs/core";
import React from "react";

export function SelectorView(props: SelectorViewProps) {
  return (
    <FieldWrapper>
      <ControlWrapper isAction key={props.label}>
        {props.label && (
          <label data-testid="selector-view-label">{props.label}</label>
        )}
        <TreeDropdown
          defaultText={props.defaultText}
          displayValue={props.displayValue}
          getDefaults={props.getDefaults}
          modifiers={{
            preventOverflow: {
              boundariesElement: "viewport",
            },
          }}
          onSelect={props.set as Setter}
          optionTree={props.options}
          position={PopoverPosition.AUTO}
          selectedLabelModifier={props.selectedLabelModifier}
          selectedValue={props.get(props.value, false) as string}
        />
      </ControlWrapper>
    </FieldWrapper>
  );
}
