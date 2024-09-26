import React, { useEffect, useCallback } from "react";
import type {
  WrappedFieldArrayProps,
  WrappedFieldMetaProps,
  WrappedFieldInputProps,
} from "redux-form";
import { Field, FieldArray } from "redux-form";
import styled from "styled-components";
import type { ControlProps, ControlData } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import DynamicTextField from "components/editorComponents/form/fields/DynamicTextField";
import type { InputProps } from "@appsmith/ads";
import { setDefaultKeyValPairFlag } from "actions/datasourceActions";
import { useDispatch } from "react-redux";
import { Button, Icon, Input, Text, Tooltip } from "@appsmith/ads";
export interface KeyValueArrayControlProps extends ControlProps {
  name: string;
  label: string;
  maxLen?: number;
  description?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actionConfig?: any;
  extraData?: ControlData[];
  isRequired?: boolean;
  showHeader?: boolean;
  headerTooltips?: {
    key?: string;
    value?: string;
  };
}

const FormRowWithLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: start;
  margin-bottom: 5px;
  & svg {
    cursor: pointer;
  }
  .form-input-field {
    width: 270px;
    + .form-input-field {
      margin-left: 5px;
    }
  }
`;

const StyledInput = styled(Input)`
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    margin: 0px;
  }
`;

const StyledButton = styled(Button)`
  margin-left: 5px;
`;
const AddMoreButton = styled(Button)``;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 30px);
  margin-bottom: 8px;

  .key-value {
    line-height: 1;
    flex: 1;
    display: flex;
    align-items: center;

    .ads-v2-icon {
      cursor: pointer;
      margin-left: 8px;
    }

    label:first-child {
      font-weight: normal;
    }
  }
`;

function KeyValueRow(
  props: KeyValueArrayControlProps & WrappedFieldArrayProps,
) {
  const { extraData = [] } = props;
  const keyName = getFieldName(extraData[0]?.configProperty);
  const valueName = getFieldName(extraData[1]?.configProperty);
  const keyFieldProps = extraData[0];
  const dispatch = useDispatch();

  const addRow = useCallback(() => {
    if (keyName && valueName) {
      props.fields.push({ [keyName[1]]: "", [valueName[1]]: "" });
    } else {
      props.fields.push({ key: "", value: "" });
    }
  }, [keyName, valueName]);

  useEffect(() => {
    // Always maintain 1 row
    if (props.fields.length < 1) {
      for (let i = props.fields.length; i < 1; i += 1) {
        addRow();
        // Since we are initializing one default key value pair, it needs to stored in redux store
        // so that it can be used to initilize datasource config form as well
        dispatch(setDefaultKeyValPairFlag(props.configProperty));
      }
    }
  }, [props.fields, keyName, valueName]);

  useEffect(() => {
    if (typeof props.fields.getAll() === "string") {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fieldsValue: any[] = JSON.parse(`${props.fields.getAll()}`);

      props.fields.removeAll();
      fieldsValue.forEach((value, index) => {
        props.fields.insert(index, value);
      });
    }
  }, [props.fields]);

  const isKeyFieldValid = useCallback(
    (value: string) => {
      if (value && keyFieldProps?.validationRegex) {
        const regex = new RegExp(keyFieldProps?.validationRegex);

        return regex.test(value)
          ? { isValid: true }
          : { isValid: false, message: keyFieldProps.validationMessage };
      }

      return { isValid: true };
    },
    [keyFieldProps?.validationRegex, keyFieldProps?.validationMessage],
  );

  return typeof props.fields.getAll() === "object" ? (
    <>
      {props.showHeader && (
        <FlexContainer>
          <div className="key-value">
            <Text kind="body-m" renderAs="label">
              Key
            </Text>
            {props.headerTooltips && (
              <Tooltip
                content={props.headerTooltips.key}
                placement="right"
                trigger="hover"
              >
                <Icon
                  className={"help-icon"}
                  color="var(--ads-v2-color-fg)"
                  name="question-line"
                  size="md"
                />
              </Tooltip>
            )}
          </div>
          <div className="key-value">
            <Text kind="body-m" renderAs="label">
              Value
            </Text>
            {props.headerTooltips && (
              <Tooltip
                content={props.headerTooltips.value}
                placement="right"
                trigger="hover"
              >
                <Icon
                  className={"help-icon"}
                  color="var(--ads-v2-color-fg)"
                  name="question-line"
                  size="md"
                />
              </Tooltip>
            )}
          </div>
        </FlexContainer>
      )}
      {/* TODO: Fix this the next time the file is edited */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {props.fields.map((field: any, index: number) => {
        let keyTextFieldName = `${field}.key`;
        let valueTextFieldName = `${field}.value`;

        if (keyName && Array.isArray(keyName) && keyName?.length)
          keyTextFieldName = `${field}.${keyName[1]}`;

        if (valueName && Array.isArray(valueName) && valueName?.length)
          valueTextFieldName = `${field}.${valueName[1]}`;

        return (
          <FormRowWithLabel key={index}>
            <div
              className="form-input-field"
              data-location-id={btoa(keyTextFieldName)}
            >
              <Field
                component={renderInput}
                name={keyTextFieldName}
                props={{
                  dataType: getType(extraData[0]?.dataType),
                  defaultValue: extraData[0]?.initialValue,
                  isKeyFieldValid: isKeyFieldValid,
                  placeholder: props.extraData
                    ? props.extraData[0]?.placeholderText
                    : `Key ${index + 1}`,
                  isRequired: extraData[0]?.isRequired,
                  name: keyTextFieldName,
                }}
              />
            </div>
            {!props.actionConfig && (
              <div className="form-input-field">
                <div
                  data-location-id={btoa(valueTextFieldName)}
                  style={{ display: "flex", flexDirection: "row" }}
                >
                  <Field
                    component={renderInput}
                    name={valueTextFieldName}
                    props={{
                      dataType: getType(extraData[1]?.dataType),
                      defaultValue: extraData[1]?.initialValue,
                      placeholder: props.extraData
                        ? props.extraData[1]?.placeholderText
                        : `Value ${index + 1}`,
                      name: valueTextFieldName,
                      isRequired: extraData[1]?.isRequired,
                    }}
                  />
                </div>
              </div>
            )}
            {!props.actionConfig && (
              <StyledButton
                className="t--delete-field"
                isIconButton
                kind="tertiary"
                onClick={() => props.fields.remove(index)}
                size="md"
                startIcon="delete"
              />
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
              />
            )}
          </FormRowWithLabel>
        );
      })}
      <AddMoreButton
        className="t--add-field t--addApiHeader btn-add-more"
        kind="tertiary"
        onClick={addRow}
        size="md"
        startIcon="add-more"
      >
        Add more
      </AddMoreButton>
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

function renderInput(
  props: InputProps & {
    dataType?: "text" | "number" | "password";
    placeholder?: string;
    defaultValue: string | number;
    isRequired: boolean;
    isKeyFieldValid?: (value: string) => { isValid: boolean; message: string };
    helperText?: string;
  } & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
): JSX.Element {
  return (
    <StyledInput
      aria-label={
        props.helperText || props.defaultValue || props.placeholder || "label"
      }
      defaultValue={props.defaultValue}
      description={props.helperText}
      errorMessage={props.isKeyFieldValid?.(props.input.value).message}
      isValid={props.isKeyFieldValid?.(props.input.value).isValid}
      name={props.input?.name}
      onChange={props.input.onChange}
      placeholder={props.placeholder}
      size="md"
      type={props.dataType}
      value={props.input.value}
    />
  );
}

export default KeyValueArrayControl;
