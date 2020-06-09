import React, { useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import DynamicTextField from "./DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
import FIELD_VALUES from "constants/FieldExpectedValue";

const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
  & svg {
    cursor: pointer;
  }
`;

const KeyValueRow = (props: Props & WrappedFieldArrayProps) => {
  useEffect(() => {
    // Always maintain 2 rows
    if (props.fields.length < 2 && props.pushFields !== false) {
      for (let i = props.fields.length; i < 2; i += 1) {
        props.fields.push({ key: "", value: "" });
      }
    }
  }, [props.fields, props.pushFields]);
  return (
    <React.Fragment>
      {typeof props.fields.getAll() === "object" && (
        <React.Fragment>
          {props.fields.map((field: any, index: number) => (
            <FormRowWithLabel key={index}>
              {index === 0 && props.label !== "" && (
                <FormLabel>{props.label}</FormLabel>
              )}
              <DynamicTextField
                className={`t--${field}.key.${index}`}
                name={`${field}.key`}
                placeholder="Key"
                singleLine
                setMaxHeight
                dataTreePath={`${props.dataTreePath}[${index}].key`}
                expected={FIELD_VALUES.API_ACTION.params}
              />
              {!props.actionConfig && (
                <DynamicTextField
                  className={`t--${field}.value.${index}`}
                  name={`${field}.value`}
                  placeholder="Value"
                  singleLine
                  setMaxHeight
                  dataTreePath={`${props.dataTreePath}[${index}].value`}
                  expected={FIELD_VALUES.API_ACTION.params}
                />
              )}

              {props.actionConfig && props.actionConfig[index] && (
                <React.Fragment>
                  <DynamicTextField
                    className={`t--${field}.value.${index}`}
                    name={`${field}.value`}
                    dataTreePath={`${props.dataTreePath}[${index}].value`}
                    setMaxHeight
                    expected={FIELD_VALUES.API_ACTION.params}
                    placeholder={
                      props.placeholder
                        ? props.placeholder
                        : props.actionConfig[index].mandatory &&
                          props.actionConfig[index].type
                        ? `${props.actionConfig[index].type}`
                        : props.actionConfig[index].type
                        ? `${props.actionConfig[index].type} (Optional)`
                        : `(Optional)`
                    }
                    singleLine
                    rightIcon={
                      props.actionConfig[index].description && props.rightIcon
                    }
                    description={props.actionConfig[index].description}
                    disabled={
                      props.actionConfig[index].editable ||
                      props.actionConfig[index].editable === undefined
                        ? false
                        : true
                    }
                  />
                </React.Fragment>
              )}
              {props.addOrDeleteFields !== false && (
                <React.Fragment>
                  {index === props.fields.length - 1 ? (
                    <Icon
                      icon="plus"
                      className="t--addApiHeader"
                      iconSize={20}
                      onClick={() => props.fields.push({ key: "", value: "" })}
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
                </React.Fragment>
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
  addOrDeleteFields?: boolean;
  mandatory?: boolean;
  type?: string;
  placeholder?: string;
  pushFields?: boolean;
  dataTreePath?: string;
};

const KeyValueFieldArray = (props: Props) => {
  return (
    <FieldArray
      name={props.name}
      component={KeyValueRow}
      rerenderOnEveryChange={false}
      {...props}
    />
  );
};

export default KeyValueFieldArray;
