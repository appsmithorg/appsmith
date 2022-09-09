import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import NumberField from "components/editorComponents/form/fields/NumberField";
import { Text, TextType } from "design-system";
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
  const { dataType, label, name, placeholder } = props;

  return (
    <FormGroup data-cy={name}>
      <Text type={TextType.P1}>{label}</Text>
      <NumberField dataType={dataType} name={name} placeholder={placeholder} />
    </FormGroup>
  );
}

class InputNumberControl extends BaseControl<InputControlProps> {
  render() {
    const {
      configProperty,
      dataType,
      label,
      placeholderText,
      propertyValue,
    } = this.props;

    return (
      <InputText
        dataType={dataType}
        label={label}
        name={configProperty}
        placeholder={placeholderText}
        value={propertyValue}
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
