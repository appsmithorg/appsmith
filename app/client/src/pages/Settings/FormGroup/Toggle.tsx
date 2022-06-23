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
  isDisableProperty?: boolean,
) {
  return function FieldToggle(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onToggle(value?: boolean) {
      componentProps.input.onChange &&
        componentProps.input.onChange(isDisableProperty ? !value : value);
      componentProps.input.onBlur &&
        componentProps.input.onBlur(isDisableProperty ? !value : value);
    }
    /* Value = !ENV_VARIABLE
    This has been done intentionally as naming convention used contains the word disabled but the UI should show the button enabled by default.
    */
    return (
      <ToggleWrapper>
        <Toggle
          cypressSelector={id}
          onToggle={onToggle}
          value={
            isDisableProperty
              ? !componentProps.input.value
              : componentProps.input.value
          }
        />
        <ToggleStatus>
          {typeof toggleText == "function"
            ? createMessage(() => toggleText(componentProps.input.value))
            : componentProps.input.value
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
            setting.name?.toLowerCase().includes("enable") ? false : true,
          )}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
