import React, { memo } from "react";
import {
  Field,
  getFormValues,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";
import { FormTextFieldProps } from "components/ads/formFields/TextField";
import Checkbox from "components/ads/Checkbox";
import { Button, Category } from "components/ads";
import { useSelector } from "react-redux";
import { SETTINGS_FORM_NAME } from "constants/forms";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import { EventName } from "utils/AnalyticsUtil";

const CheckboxWrapper = styled.div`
  display: grid;
  margin-bottom: 8px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
`;

const StyledAuthButton = styled(Button)`
  height: 30px;
  width: 94px;
  padding: 8px 16px;
`;

type CheckboxProps = {
  label?: string;
  id?: string;
  isDisabled?: boolean;
  needsUpgrade?: boolean;
  text: string;
  labelSuffix?: React.ReactElement;
  upgradeLogEventName?: EventName;
  upgradeIntercomEventMessage?: string;
};

function FieldCheckboxWithCheckboxText(props: CheckboxProps) {
  return function FieldCheckbox(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    const { labelSuffix } = props;
    const val = componentProps.input.value;
    const { onUpgrade } = useOnUpgrade({
      logEventName: props.upgradeLogEventName,
      intercomMessage: props.upgradeIntercomEventMessage,
    });

    function onCheckbox(value?: boolean) {
      const CheckboxValue = props.isDisabled ? !value : value;
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
          cypressSelector={props.id}
          disabled={props.isDisabled}
          isDefaultChecked={val}
          label={props.text}
          onCheckChange={onCheckbox}
        />
        <div>{labelSuffix}</div>
        {props.needsUpgrade && (
          <StyledAuthButton
            category={Category.tertiary}
            onClick={() => onUpgrade()}
            text="Upgrade"
          />
        )}
      </CheckboxWrapper>
    );
  };
}

const StyledFieldCheckboxGroup = styled.div`
  margin-bottom: 8px;
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export function CheckboxComponent({ setting }: SettingComponentProps) {
  const settings = useSelector(formValuesSelector);

  return (
    <StyledFieldCheckboxGroup>
      <FormGroup setting={setting}>
        <Field
          component={FieldCheckboxWithCheckboxText({
            label: setting.label,
            text: setting.text || "",
            id: setting.id,
            isDisabled: setting.isDisabled && setting.isDisabled(settings),
            needsUpgrade: setting.needsUpgrade,
            labelSuffix: setting.textSuffix,
            upgradeLogEventName: setting.upgradeLogEventName,
            upgradeIntercomEventMessage: setting.upgradeIntercomEventMessage,
          })}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldCheckboxGroup>
  );
}

export default memo(CheckboxComponent);
