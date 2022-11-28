import { TextViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { InputText } from "components/propertyControls/InputTextControl";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import React from "react";

export function TextView(props: TextViewProps) {
  return (
    <FieldWrapper>
      <ControlWrapper isAction key={props.label}>
        {props.label && (
          <label data-testid="text-view-label">{props.label}</label>
        )}
        <InputText
          additionalAutocomplete={props.additionalAutoComplete}
          evaluatedValue={props.get(props.value, false) as string}
          expected={{
            type: "string",
            example: "showMessage('Hello World!', 'info')",
            autocompleteDataType: AutocompleteDataType.STRING,
          }}
          label={props.label}
          onChange={(event: any) => {
            if (event.target) {
              props.set(event.target.value, true);
            } else {
              props.set(event, true);
            }
          }}
          value={props.get(props.value, props.index, false) as string}
        />
      </ControlWrapper>
    </FieldWrapper>
  );
}
