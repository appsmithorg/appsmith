import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { Checkbox, Tag, Text } from "design-system";
import { useSelector } from "react-redux";
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { isTenantConfig } from "@appsmith/utils/adminSettingsHelpers";
import { BUSINESS_TAG, createMessage } from "@appsmith/constants/messages";

const CheckboxWrapper = styled.div`
  display: grid;
  margin-bottom: 8px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
`;

type CheckboxProps = {
  label?: string;
  id?: string;
  isDisabled?: boolean;
  needsUpgrade?: boolean;
  text: string;
  labelSuffix?: React.ReactElement;
  isPropertyDisabled?: boolean;
};

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
  margin-bottom: 8px;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export function CheckboxComponent({ setting }: SettingComponentProps) {
  const settings: Record<string, any> = useSelector(formValuesSelector);

  return (
    <StyledFieldCheckboxGroup>
      <div className="flex gap-1 items-center">
        <Text
          className="admin-settings-form-group-label pt-2 pb-2"
          color="var(--ads-v2-color-fg)"
          data-testid="admin-settings-form-group-label"
          kind="heading-xs"
          renderAs="p"
        >
          {setting.label}
        </Text>
        {setting.needsUpgrade && (
          <Tag isClosable={false}>{createMessage(BUSINESS_TAG)}</Tag>
        )}
      </div>
      <Field
        component={FieldCheckboxWithCheckboxText({
          label: setting.label,
          text: setting.text || "",
          id: setting.id,
          isDisabled: setting.isDisabled && setting.isDisabled(settings),
          needsUpgrade: setting.needsUpgrade,
          labelSuffix: setting.textSuffix,
          isPropertyDisabled: isTenantConfig(setting.id)
            ? false
            : !setting.name?.toLowerCase().includes("enable"),
        })}
        name={setting.name}
      />
    </StyledFieldCheckboxGroup>
  );
}

export default memo(CheckboxComponent);
