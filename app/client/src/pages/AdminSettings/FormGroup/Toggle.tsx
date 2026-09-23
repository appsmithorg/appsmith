import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import styled from "styled-components";
import { FormGroup, type SettingComponentProps } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { createMessage } from "ee/constants/messages";
import { Switch, Text } from "@appsmith/ads";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { useSelector } from "react-redux";

const ToggleWrapper = styled.div<{ $compact?: boolean }>`
  margin-bottom: ${(props) => (props.$compact ? 0 : 16)}px;
`;

const ToggleStatus = styled(Text)``;

function FieldToggleWithToggleText(
  toggleText?: (value: boolean) => string,
  id?: string,
  isPropertyDisabled?: boolean,
  label?: React.ReactNode,
  isDisabled = false,
  text?: string,
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

    const switchLabel = text
      ? text
      : typeof toggleText == "function"
        ? createMessage(() => toggleText(val))
        : createMessage(() => `${label ? `Enable ${label}` : "Enable"}`);

    return (
      <ToggleWrapper $compact={Boolean(text)}>
        <Switch
          data-testid={id}
          isDisabled={isDisabled}
          isSelected={isPropertyDisabled ? !val : val}
          onChange={onToggle}
        >
          <ToggleStatus>{switchLabel}</ToggleStatus>
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
  const field = (
    <Field
      component={FieldToggleWithToggleText(
        setting.toggleText,
        setting.id,
        !setting.name?.toLowerCase().includes("enable"),
        setting.label,
        setting.isDisabled ? setting.isDisabled(settings) : false,
        setting.text,
      )}
      name={setting.name || setting.id}
    />
  );

  return (
    <StyledFieldToggleGroup className="t--admin-settings-toggle">
      {setting.text || setting.subText ? (
        <FormGroup
          className={`t--admin-settings-${setting.name || setting.id}`}
          setting={setting}
        >
          {field}
        </FormGroup>
      ) : (
        field
      )}
    </StyledFieldToggleGroup>
  );
}

export default memo(ToggleComponent);
