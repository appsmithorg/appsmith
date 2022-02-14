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

const ToggleWrapper = styled.div``;

const ToggleStatus = styled.span`
  position: relative;
  top: -10px;
  left: 68px;
`;

function FieldToggleWithToggleText(toggleText?: (value: boolean) => string) {
  return function FieldToggle(
    ComponentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onToggle(value?: boolean) {
      ComponentProps.input.onChange && ComponentProps.input.onChange(value);
      ComponentProps.input.onBlur && ComponentProps.input.onBlur(value);
    }
    return (
      <ToggleWrapper>
        <Toggle onToggle={onToggle} value={ComponentProps.input.value} />
        <ToggleStatus>
          {typeof toggleText == "function"
            ? createMessage(() => toggleText(ComponentProps.input.value))
            : ComponentProps.input.value
            ? createMessage(() => "Enabled")
            : createMessage(() => "Disabled")}
        </ToggleStatus>
      </ToggleWrapper>
    );
  };
}

const StyledFieldToggleGroup = styled.div`
  margin-bottom: 8px;

  & .slider {
    margin-top: 10px;
  }
`;

export function ToggleComponent({ setting }: SettingComponentProps) {
  return (
    <StyledFieldToggleGroup>
      <FormGroup setting={setting}>
        <Field
          component={FieldToggleWithToggleText(setting.toggleText)}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
