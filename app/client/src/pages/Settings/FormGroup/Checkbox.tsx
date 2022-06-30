import React, { memo } from "react";
import {
  Field,
  WrappedFieldInputProps,
  WrappedFieldMetaProps,
} from "redux-form";
import styled from "styled-components";
import { FormGroup, SettingComponentProps } from "./Common";
import { FormTextFieldProps } from "components/ads/formFields/TextField";
import Checkbox from "components/ads/Checkbox";
import { createMessage } from "@appsmith/constants/messages";
import { Button, Category } from "components/ads";
import BrandingBadge from "pages/AppViewer/BrandingBadge";
import { isDisabled } from "@testing-library/user-event/dist/utils";

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
};

function FieldCheckboxWithCheckboxText(props: CheckboxProps) {
  return function FieldCheckbox(
    componentProps: FormTextFieldProps & {
      meta: Partial<WrappedFieldMetaProps>;
      input: Partial<WrappedFieldInputProps>;
    },
  ) {
    const val = componentProps.input.value;

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
          isDefaultChecked={props.isDisabled ? !val : val}
          label={props.text}
          onCheckChange={onCheckbox}
        />
        <BrandingBadge />
        {props.needsUpgrade && (
          <StyledAuthButton
            category={Category.tertiary}
            onClick={() => {
              //
            }}
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

export function CheckboxComponent({ setting }: SettingComponentProps) {
  return (
    <StyledFieldCheckboxGroup>
      <FormGroup setting={setting}>
        <Field
          component={FieldCheckboxWithCheckboxText({
            label: setting.label,
            text: setting.text || "",
            id: setting.id,
            isDisabled: setting.needsUpgrade,
            needsUpgrade: setting.needsUpgrade,
          })}
          name={setting.name}
        />
      </FormGroup>
    </StyledFieldCheckboxGroup>
  );
}

export default memo(CheckboxComponent);
