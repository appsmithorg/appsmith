import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import styled from "styled-components";
import { FormGroup, type SettingComponentProps } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { Checkbox } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { isTenantConfig } from "ee/utils/adminSettingsHelpers";

const CheckboxWrapper = styled.div`
  display: grid;
  margin-bottom: 8px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
`;

interface CheckboxProps {
  label?: React.ReactNode;
  id?: string;
  isDisabled?: boolean;
  isFeatureEnabled?: boolean;
  text: string;
  labelSuffix?: React.ReactElement;
  isPropertyDisabled?: boolean;
}

function FieldCheckboxWithCheckboxText(props: CheckboxProps) {
  return function FieldCheckbox(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    const { isPropertyDisabled, labelSuffix } = props;
    const val = componentProps.input.value;

    function onCheckbox(value?: boolean) {
      const CheckboxValue = isPropertyDisabled ? !value : value;

      componentProps.input.onChange &&
        componentProps.input.onChange(CheckboxValue);
      componentProps.input.onBlur && componentProps.input.onBlur(CheckboxValue);
    }

    /* Value = !ENV_VARIABLE
    This has been done intentionally as naming convention used contains the word disabled but the UI should show the button enabled by default.
    */
    return (
      <CheckboxWrapper>
        <Checkbox
          data-testid={props.id}
          defaultSelected={isPropertyDisabled ? !val : val}
          isDisabled={props.isDisabled}
          onChange={onCheckbox}
          value={props.id}
        >
          {props.text}
        </Checkbox>
        <div>{labelSuffix}</div>
      </CheckboxWrapper>
    );
  };
}

const StyledFieldCheckboxGroup = styled.div`
  .styled-label {
    padding: 0 0 0.5rem;
  }

  .admin-settings-form-group-label {
    font-weight: var(--ads-v2-h5-font-weight);
  }
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export function CheckboxComponent({ setting }: SettingComponentProps) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings: Record<string, any> = useSelector(formValuesSelector);

  return (
    <StyledFieldCheckboxGroup>
      <FormGroup
        className={`t--admin-settings-checkbox t--admin-settings-${
          setting.name || setting.id
        }`}
        setting={setting}
      >
        <Field
          component={FieldCheckboxWithCheckboxText({
            label: setting.label,
            text: setting.text || "",
            id: setting.id,
            isDisabled: setting.isDisabled && setting.isDisabled(settings),
            isFeatureEnabled: setting.isFeatureEnabled,
            labelSuffix: setting.textSuffix,
            isPropertyDisabled: isTenantConfig(setting.id)
              ? false
              : !setting.name?.toLowerCase().includes("enable"),
          })}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldCheckboxGroup>
  );
}

export default memo(CheckboxComponent);
