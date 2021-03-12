import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import NumberField from "components/editorComponents/form/fields/NumberField";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import styled from "styled-components";

const FormGroup = styled.div`
  display: flex;
  align-items: center;

  .${Classes.TEXT} {
    color: ${(props) => props.theme.colors.apiPane.settings.textColor};
    margin-right: ${(props) => props.theme.spaces[12]}px;
  }
`;

export function InputText(props: {
  label: string;
  value: string;
  placeholder?: string;
  dataType?: string;
  name: string;
}) {
  const { name, placeholder, dataType, label } = props;

  return (
    <FormGroup data-cy={name}>
      <Text type={TextType.P1}>{label}</Text>
      <NumberField name={name} placeholder={placeholder} dataType={dataType} />
    </FormGroup>
  );
}

class InputNumberControl extends BaseControl<InputControlProps> {
  render() {
    const {
      propertyValue,
      label,
      placeholderText,
      configProperty,
      dataType,
    } = this.props;

    return (
      <InputText
        name={configProperty}
        label={label}
        value={propertyValue}
        placeholder={placeholderText}
        dataType={dataType}
      />
    );
  }

  getControlType(): ControlType {
    return "NUMBER_INPUT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
}

export default InputNumberControl;
