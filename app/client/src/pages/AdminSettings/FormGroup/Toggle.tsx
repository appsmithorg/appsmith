import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { createMessage } from "ee/constants/messages";
import { Switch, Text } from "@appsmith/ads";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { useSelector } from "react-redux";

const ToggleWrapper = styled.div`
  margin-bottom: 16px;
`;

const ToggleStatus = styled(Text)``;

function FieldToggleWithToggleText(
  toggleText?: (value: boolean) => string,
  id?: string,
  isPropertyDisabled?: boolean,
  label?: React.ReactNode,
  isDisabled = false,
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

    //TODO: This should be refactored to utilize the functionality of the switch component for state
    return (
      <ToggleWrapper>
        <Switch
          data-testid={id}
          isDisabled={isDisabled}
          isSelected={isPropertyDisabled ? !val : val}
          onChange={onToggle}
        >
          <ToggleStatus>
            {typeof toggleText == "function"
              ? createMessage(() => toggleText(val))
              : createMessage(() => `${label ? `Enable ${label}` : "Enable"}`)}
          </ToggleStatus>
        </Switch>
      </ToggleWrapper>
    );
  };
}

const StyledFieldToggleGroup = styled.div`
  margin-bottom: 8px;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export function ToggleComponent({ setting }: SettingComponentProps) {
  const settings = useSelector(formValuesSelector);

  return (
    <StyledFieldToggleGroup className="t--admin-settings-toggle">
      <Field
        component={FieldToggleWithToggleText(
          setting.toggleText,
          setting.id,
          !setting.name?.toLowerCase().includes("enable"),
          setting.label,
          setting.isDisabled ? setting.isDisabled(settings) : false,
        )}
        name={setting.name || setting.id}
      />
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
