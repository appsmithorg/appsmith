import React, { memo } from "react";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field, getFormValues } from "redux-form";
import styled from "styled-components";
import type { SettingComponentProps } from "./Common";
import { FormGroup } from "./Common";
import type { FormTextFieldProps } from "components/utils/ReduxFormTextField";
import { Button, Checkbox } from "design-system";
import { useSelector } from "react-redux";
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import type { EventName } from "utils/AnalyticsUtil";

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
  upgradeLogEventName?: EventName;
  upgradeIntercomMessage?: string;
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
    const { onUpgrade } = useOnUpgrade({
      logEventName: props.upgradeLogEventName,
      intercomMessage: props.upgradeIntercomMessage,
    });

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
          defaultSelected={isPropertyDisabled ? !val : val}
          isDisabled={props.isDisabled}
          onChange={onCheckbox}
          value={props.id}
        >
          {props.text}
        </Checkbox>
        <div>{labelSuffix}</div>
        {props.needsUpgrade && (
          <Button kind="secondary" onClick={onUpgrade}>
            Upgrade
          </Button>
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
            upgradeIntercomMessage: setting.upgradeIntercomMessage,
            isPropertyDisabled: !setting.name?.toLowerCase().includes("enable"),
          })}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldCheckboxGroup>
  );
}

export default memo(CheckboxComponent);
