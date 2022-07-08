import React, { memo } from "react";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";
import { FormTextFieldProps } from "components/ads/formFields/TextField";
import Toggle from "components/ads/Toggle";
import { createMessage } from "@appsmith/constants/messages";

const ToggleWrapper = styled.div`
  display: flex;
  margin-bottom: 8px;
`;

const ToggleStatus = styled.span`
  margin-left: 64px;
`;

function FieldToggleWithToggleText(
  toggleText?: (value: boolean) => string,
  id?: string,
  isPropertyDisabled?: boolean,
) {
  return function FieldToggle(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    const val = componentProps.input.value;

    function onToggle(value?: boolean) {
      const toggleValue = isPropertyDisabled ? !value : value;
      componentProps.input.onChange &&
        componentProps.input.onChange(toggleValue);
      componentProps.input.onBlur && componentProps.input.onBlur(toggleValue);
    }
    /* Value = !ENV_VARIABLE
    This has been done intentionally as naming convention used contains the word disabled but the UI should show the button enabled by default.
    */
    return (
      <ToggleWrapper>
        <Toggle
          cypressSelector={id}
          onToggle={onToggle}
          value={isPropertyDisabled ? !val : val}
        />
        <ToggleStatus>
          {typeof toggleText == "function"
            ? createMessage(() => toggleText(val))
            : val
            ? createMessage(() => "Enabled")
            : createMessage(() => "Disabled")}
        </ToggleStatus>
      </ToggleWrapper>
    );
  };
}

const StyledFieldToggleGroup = styled.div`
  margin-bottom: 8px;
`;

export function ToggleComponent({ setting }: SettingComponentProps) {
  return (
    <StyledFieldToggleGroup>
      <FormGroup setting={setting}>
        <Field
          component={FieldToggleWithToggleText(
            setting.toggleText,
            setting.id,
            !setting.name?.toLowerCase().includes("enable"),
          )}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
