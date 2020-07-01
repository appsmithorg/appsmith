import React, { useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import BaseControl, { ControlProps, ControlData } from "./BaseControl";
import TextField from "components/editorComponents/form/fields/TextField";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import FormLabel from "components/editorComponents/FormLabel";
import { InputType } from "widgets/InputWidget";

const FormRowWithLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  & svg {
    cursor: pointer;
  }
`;

const StyledTextField = styled(TextField)`
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const KeyValueRow = (props: Props & WrappedFieldArrayProps) => {
  const { extraData = [] } = props;
  const keyName = getFieldName(extraData[0].configProperty);
  const valueName = getFieldName(extraData[1].configProperty);
  const valueDataType = getType(extraData[1].dataType);
  let isRequired: boolean | undefined;

  useEffect(() => {
    // Always maintain 1 row
    if (props.fields.length < 1) {
      for (let i = props.fields.length; i < 1; i += 1) {
        props.fields.push({ [keyName[1]]: "", [valueName[1]]: "" });
      }
    }
  }, [props.fields, keyName, valueName]);

  useEffect(() => {
    if (typeof props.fields.getAll() === "string") {
      const fieldsValue: [] = JSON.parse(`${props.fields.getAll()}`);
      props.fields.removeAll();
      fieldsValue.forEach((value, index) => {
        props.fields.insert(index, value);
      });
    }
  }, [props.fields]);

  if (extraData) {
    isRequired = extraData[0].isRequired || extraData[1].isRequired;
  }

  return (
    <React.Fragment>
      {typeof props.fields.getAll() === "object" && (
        <React.Fragment>
          {props.fields.map((field: any, index: number) => (
            <FormRowWithLabel key={index} style={{ marginTop: 16 }}>
              <div style={{ width: "50vh" }}>
                <FormLabel>
                  {extraData && extraData[0].label} {isRequired && "*"}
                </FormLabel>
                <TextField name={`${field}.${keyName[1]}`} />
              </div>
              {!props.actionConfig && (
                <div style={{ marginLeft: 16 }}>
                  <FormLabel>
                    {extraData && extraData[1].label} {isRequired && "*"}
                  </FormLabel>
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <div style={{ marginRight: 14, width: 72 }}>
                      <StyledTextField
                        name={`${field}.${valueName[1]}`}
                        type={valueDataType}
                      />
                    </div>
                    {index === props.fields.length - 1 ? (
                      <Icon
                        icon="plus"
                        iconSize={20}
                        onClick={() =>
                          props.fields.push({ key: "", value: "" })
                        }
                        color={"#A3B3BF"}
                        style={{ alignSelf: "center" }}
                      />
                    ) : (
                      <FormIcons.DELETE_ICON
                        height={20}
                        width={20}
                        onClick={() => props.fields.remove(index)}
                        style={{ alignSelf: "center" }}
                      />
                    )}
                  </div>
                </div>
              )}

              {props.actionConfig && (
                <DynamicTextField
                  name={`${field}.value`}
                  placeholder={
                    props.actionConfig[index].mandatory &&
                    props.actionConfig[index].type
                      ? `Value (Type: ${props.actionConfig[index].type})`
                      : `Value (optional)`
                  }
                  singleLine
                  rightIcon={
                    props.actionConfig[index].description && props.rightIcon
                  }
                  description={props.actionConfig[index].description}
                />
              )}
            </FormRowWithLabel>
          ))}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

type Props = {
  name: string;
  label: string;
  rightIcon?: Function;
  description?: string;
  actionConfig?: any;
  extraData?: ControlData[];
  isRequired?: boolean;
};

class KeyValueFieldArray extends BaseControl<KeyValueArrayProps> {
  render() {
    const name = getFieldName(this.props.configProperty);

    return (
      <FieldArray
        name={name[0]}
        component={KeyValueRow}
        rerenderOnEveryChange={false}
        {...this.props}
      />
    );
  }

  getControlType(): ControlType {
    return "KEYVALUE_ARRAY";
  }
}

const getFieldName = (configProperty: string) => {
  return configProperty.split("[*].");
};

const getType = (dataType: InputType | undefined) => {
  switch (dataType) {
    case "PASSWORD":
      return "password";
    case "NUMBER":
      return "number";
    default:
      return "text";
  }
};

export interface KeyValueArrayProps extends ControlProps {
  name: string;
  label: string;
  rightIcon?: Function;
  description?: string;
  actionConfig?: any;
}

export default KeyValueFieldArray;
