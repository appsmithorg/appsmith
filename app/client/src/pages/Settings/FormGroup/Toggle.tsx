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
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    function onToggle(value?: boolean) {
      componentProps.input.onChange && componentProps.input.onChange(!value);
      componentProps.input.onBlur && componentProps.input.onBlur(!value);
    }
    /* Value = !ENV_VARIABLE
    This has been done intentionally as naming convention used contains the word disabled but the UI should show the button enabled by default.
    */
    return (
      <ToggleWrapper>
        <Toggle onToggle={onToggle} value={!componentProps.input.value} />
        <ToggleStatus>
          {typeof toggleText == "function"
            ? createMessage(() => toggleText(!componentProps.input.value))
            : !componentProps.input.value
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
