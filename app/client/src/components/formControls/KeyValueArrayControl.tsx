import React, { useEffect, useCallback, JSXElementConstructor } from "react";
import {
  Field,
  FieldArray,
  WrappedFieldArrayProps,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import BaseControl, { ControlProps, ControlData } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import { Colors } from "constants/Colors";
import TextInput, { TextInputProps } from "components/ads/TextInput";
export interface KeyValueArrayControlProps extends ControlProps {
  name: string;
  label: string;
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
  extraData?: ControlData[];
  isRequired?: boolean;
}

const FormRowWithLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  & svg {
    cursor: pointer;
  }
`;

const StyledTextInput = styled(TextInput)`
  min-width: 66px;
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0px;
  }
`;

function KeyValueRow(
  props: KeyValueArrayControlProps & WrappedFieldArrayProps,
) {
  const { extraData = [] } = props;
  const keyName = getFieldName(extraData[0]?.configProperty);
  const valueName = getFieldName(extraData[1]?.configProperty);
  const keyFieldProps = extraData[0];

  useEffect(() => {
    // Always maintain 1 row
    if (props.fields.length < 1) {
      for (let i = props.fields.length; i < 1; i += 1) {
        if (keyName && valueName) {
          props.fields.push({ [keyName[1]]: "", [valueName[1]]: "" });
        } else {
          props.fields.push({ key: "", value: "" });
        }
      }
    }
  }, [props.fields, keyName, valueName]);

  useEffect(() => {
    if (typeof props.fields.getAll() === "string") {
      const fieldsValue: any[] = JSON.parse(`${props.fields.getAll()}`);
      props.fields.removeAll();
      fieldsValue.forEach((value, index) => {
        props.fields.insert(index, value);
      });
    }
  }, [props.fields]);

  const keyFieldValidate = useCallback(
    (value: string) => {
      if (value && keyFieldProps?.validationRegex) {
        const regex = new RegExp(keyFieldProps?.validationRegex);

        return regex.test(value) ? undefined : keyFieldProps.validationMessage;
      }

      return undefined;
    },
    [keyFieldProps?.validationRegex, keyFieldProps?.validationMessage],
  );

  return typeof props.fields.getAll() === "object" ? (
    <>
      {props.fields.map((field: any, index: number) => {
        let keyTextFieldName = `${field}.key`;
        let valueTextFieldName = `${field}.value`;

        if (keyName && Array.isArray(keyName) && keyName?.length)
          keyTextFieldName = `${field}.${keyName[1]}`;

        if (valueName && Array.isArray(valueName) && valueName?.length)
          valueTextFieldName = `${field}.${valueName[1]}`;

        const otherProps: Record<string, any> = {};
        if (
          props.actionConfig &&
          props.actionConfig[index].description &&
          props.rightIcon
        ) {
          //TODO: may not be in use
          otherProps.rightIcon = (
            <HelperTooltip
              description={props.actionConfig[index].description}
              rightIcon={
                props.actionConfig[index].description && props.rightIcon
              }
            />
          );
        }
        return (
          <FormRowWithLabel
            key={index}
            style={{ marginTop: index > 0 ? "16px" : "0px" }}
          >
            <div style={{ width: "50vh" }}>
              <Field
                component={renderTextInput}
                name={keyTextFieldName}
                props={{
                  dataType: getType(extraData[0]?.dataType),
                  defaultValue: props.initialValue,
                  keyFieldValidate,
                  placeholder: props.extraData
                    ? props.extraData[1]?.placeholderText
                    : "",
                  isRequired: extraData[0]?.isRequired,
                }}
              />
            </div>
            {!props.actionConfig && (
              <div style={{ marginLeft: "16px", width: "50vh" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <Field
                    component={renderTextInput}
                    name={valueTextFieldName}
                    props={{
                      dataType: getType(extraData[1]?.dataType),
                      defaultValue: props.initialValue,
                      placeholder: props.extraData
                        ? props.extraData[1]?.placeholderText
                        : "",
                      isRequired: extraData[1]?.isRequired,
                    }}
                  />
                  {index === props.fields.length - 1 ? (
                    <Icon
                      color={Colors["CADET_BLUE"]}
                      icon="plus"
                      iconSize={20}
                      onClick={() => {
                        props.fields.push({ key: "", value: "" });
                      }}
                      style={{ marginLeft: "16px", alignSelf: "center" }}
                    />
                  ) : (
                    <FormIcons.DELETE_ICON
                      color={Colors["CADET_BLUE"]}
                      height={20}
                      onClick={() => props.fields.remove(index)}
                      style={{ marginLeft: "16px", alignSelf: "center" }}
                      width={20}
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
                {...otherProps}
              />
            )}
          </FormRowWithLabel>
        );
      })}
    </>
  ) : null;
}

class KeyValueArrayControl extends BaseControl<KeyValueArrayControlProps> {
  render() {
    const name = getFieldName(this.props.configProperty);

    return (
      <FieldArray
        component={KeyValueRow}
        rerenderOnEveryChange={false}
        {...this.props}
        name={name ? name[0] : ""}
      />
    );
  }

  getControlType(): ControlType {
    return "KEYVALUE_ARRAY";
  }
}

const getFieldName = (configProperty: string): string[] | undefined => {
  if (configProperty) return configProperty.split("[*].");
};

const getType = (dataType: string | undefined) => {
  switch (dataType) {
    case "PASSWORD":
      return "password";
    case "NUMBER":
      return "number";
    default:
      return "text";
  }
};

function renderTextInput(
  props: TextInputProps & {
    dataType?: "text" | "number" | "password";
    placeholder?: string;
    defaultValue: string | number;
    isRequired: boolean;
    keyFieldValidate?: (value: string) => { isValid: boolean; message: string };
    errorMsg?: string;
    helperText?: string;
  } & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
): JSX.Element {
  return (
    <StyledTextInput
      dataType={props.dataType}
      defaultValue={props.defaultValue}
      errorMsg={props.errorMsg}
      helperText={props.helperText}
      onChange={props.input.onChange}
      placeholder={props.placeholder}
      validator={props.keyFieldValidate}
      value={props.input.value}
      width="100%"
    />
  );
}

export default KeyValueArrayControl;
