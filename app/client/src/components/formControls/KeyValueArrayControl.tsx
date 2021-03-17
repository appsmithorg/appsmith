import React, { useEffect, useCallback, JSXElementConstructor } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import BaseControl, { ControlProps } from "./BaseControl";
import TextField from "components/editorComponents/form/fields/TextField";
import { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import FormLabel from "components/editorComponents/FormLabel";
import { InputType } from "widgets/InputWidget";
import HelperTooltip from "components/editorComponents/HelperTooltip";
import { Colors } from "constants/Colors";

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

const KeyValueRow = (props: KeyValueArrayProps & WrappedFieldArrayProps) => {
  const { extraData = [] } = props;
  const keyName = getFieldName(extraData[0].configProperty);
  const valueName = getFieldName(extraData[1].configProperty);
  const valueDataType = getType(extraData[1].dataType);
  const keyFieldProps = extraData[0];

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
      const fieldsValue: any[] = JSON.parse(`${props.fields.getAll()}`);
      props.fields.removeAll();
      fieldsValue.forEach((value, index) => {
        props.fields.insert(index, value);
      });
    }
  }, [props.fields]);

  const keyFieldValidate = useCallback(
    (value: string) => {
      if (value && keyFieldProps.validationRegex) {
        const regex = new RegExp(keyFieldProps.validationRegex);

        return regex.test(value) ? undefined : keyFieldProps.validationMessage;
      }

      return undefined;
    },
    [keyFieldProps.validationRegex, keyFieldProps.validationMessage],
  );

  if (extraData) {
    isRequired = extraData[0].isRequired || extraData[1].isRequired;
  }

  return (
    <React.Fragment>
      {typeof props.fields.getAll() === "object" && (
        <React.Fragment>
          {props.fields.map((field: any, index: number) => {
            const otherProps: Record<string, any> = {};
            if (
              props.actionConfig &&
              props.actionConfig[index].description &&
              props.rightIcon
            ) {
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
              <FormRowWithLabel key={index} style={{ marginTop: 16 }}>
                <div style={{ width: "50vh" }}>
                  <FormLabel>
                    {extraData && extraData[0].label} {isRequired && "*"}
                  </FormLabel>
                  <TextField
                    name={`${field}.${keyName[1]}`}
                    showError
                    validate={keyFieldValidate}
                    placeholder={
                      (extraData && extraData[0].placeholderText) || ""
                    }
                  />
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
                          placeholder={
                            (extraData && extraData[1].placeholderText) || ""
                          }
                        />
                      </div>
                      {index === props.fields.length - 1 ? (
                        <Icon
                          icon="plus"
                          iconSize={20}
                          onClick={() =>
                            props.fields.push({ key: "", value: "" })
                          }
                          color={Colors["CADET_BLUE"]}
                          style={{ alignSelf: "center" }}
                        />
                      ) : (
                        <FormIcons.DELETE_ICON
                          height={20}
                          width={20}
                          color={Colors["CADET_BLUE"]}
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
                    {...otherProps}
                  />
                )}
              </FormRowWithLabel>
            );
          })}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

class KeyValueFieldArray extends BaseControl<KeyValueArrayProps> {
  render() {
    const name = getFieldName(this.props.configProperty);

    return (
      <FieldArray
        component={KeyValueRow}
        rerenderOnEveryChange={false}
        {...this.props}
        name={name[0]}
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
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
}

export default KeyValueFieldArray;
