import React from "react";
import {
  Field,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import InputComponent, { InputType } from "../TextInput";
import { Intent } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { HelpIcons } from "icons/HelpIcons";

const CopyIcon = HelpIcons.COPY_ICON;

const Label = styled.div`
  font-size: 14px;
  margin: 8px 0;
  color: ${Colors.CHARCOAL};
`;

const InputCopyWrapper = styled.div`
  display: flex;
  align-items: center;

  input {
    width: 40rem;
  }

  .copy-icon {
    margin-left: 12px;
  }
`;

const renderComponent = (
  componentProps: FormTextFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  return (
    <>
      {componentProps.label && <Label>{componentProps.label}</Label>}
      <InputCopyWrapper>
        <InputComponent {...componentProps} {...componentProps.input} fill />
        {componentProps.iscopy === "true" && (
          <CopyIcon
            className={"copy-icon"}
            color={Colors.GREY_7}
            height={16}
            onClick={() =>
              componentProps.handleCopy(componentProps.input.value)
            }
            width={16}
          />
        )}
      </InputCopyWrapper>
    </>
  );
};

export type FormTextFieldProps = {
  name: string;
  type?: InputType;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
  helperText?: string;
  iscopy?: string;
  handleCopy: (value: string) => void;
};

function UneditableField(props: FormTextFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default UneditableField;
