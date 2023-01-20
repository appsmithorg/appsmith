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
          <label
            className="!text-gray-600 !text-xs"
            data-testid="text-view-label"
          >
            {props.label}
          </label>
        )}
        <InputText
          additionalAutocomplete={props.additionalAutoComplete}
          evaluatedValue={props.get(props.value, false) as string}
          expected={{
            type: "string",
            example: props.exampleText,
            autocompleteDataType: AutocompleteDataType.STRING,
            openExampleTextByDefault: true,
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
