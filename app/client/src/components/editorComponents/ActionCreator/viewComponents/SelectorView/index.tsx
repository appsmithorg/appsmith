import { SelectorViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { Setter, TreeDropdown } from "design-system-old";
import { PopoverPosition } from "@blueprintjs/core";
import React from "react";

export function SelectorView(props: SelectorViewProps) {
  return (
    <FieldWrapper>
      <ControlWrapper isAction key={props.label}>
        {props.label && (
          <label
            className="!text-gray-600 !text-xs"
            data-testid="selector-view-label"
          >
            {props.label}
          </label>
        )}
        <TreeDropdown
          defaultText={props.defaultText}
          displayValue={props.displayValue}
          getDefaults={props.getDefaults}
          menuWidth={256}
          modifiers={{
            preventOverflow: {
              boundariesElement: "viewport",
            },
          }}
          onSelect={props.set as Setter}
          optionTree={props.options}
          position={PopoverPosition.BOTTOM}
          selectedLabelModifier={props.selectedLabelModifier}
          selectedValue={props.get(props.value, false) as string}
        />
      </ControlWrapper>
    </FieldWrapper>
  );
}
