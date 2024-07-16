import React from "react";
import type { InputType } from "../TextInput";
import InputComponent from "../TextInput";
import type { AnyStyledComponent } from "styled-components";
import styled from "styled-components";
import { ControlIcons } from "../ControlIcons";

const CopyIcon = ControlIcons.COPY_CONTROL as AnyStyledComponent;

const Label = styled.div`
  font-size: 14px;
  margin: 8px 0;
  color: var(--ads-uneditable-text-field-label-text-color);
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

type UneditableFieldPropType = FormUneditableTextFieldProps & {
  meta: any;
  // meta: Partial<WrappedFieldMetaProps>;
  input: any;
  // input: Partial<WrappedFieldInputProps>;
};

export const UneditableField = (componentProps: UneditableFieldPropType) => {
  const { handleCopy } = componentProps;
  return (
    <>
      {componentProps.label && <Label>{componentProps.label}</Label>}
      <InputCopyWrapper>
        <InputComponent {...componentProps} {...componentProps.input} fill />
        {componentProps.iscopy === "true" && (
          <CopyIcon
            className={"copy-icon"}
            color="var(--ads-old-color-gray-7)"
            height={16}
            onClick={() => handleCopy(componentProps.input.value)}
            width={16}
          />
        )}
      </InputCopyWrapper>
    </>
  );
};

export interface FormUneditableTextFieldProps {
  name: string;
  type?: InputType;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
  helperText?: string;
  iscopy?: string;
  handleCopy: (value: string) => void;
}

// function UneditableField(props: FormUneditableTextFieldProps) {
// TODO: The line below should replace all usages of UneditableField in ce
//   return <Field component={UneditableField} {...props} asyncControl />;
// }

export default UneditableField;
