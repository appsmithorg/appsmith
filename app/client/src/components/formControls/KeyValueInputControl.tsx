import React, { JSXElementConstructor, useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import BaseControl, { ControlProps, ControlData } from "./BaseControl";
import TextField from "components/editorComponents/form/fields/TextField";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import { Colors } from "constants/Colors";

const FormRowWithLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  & svg {
    cursor: pointer;
  }
`;

const KeyValueRow = (props: Props & WrappedFieldArrayProps) => {
  useEffect(() => {
    // Always maintain 1 row
    if (props.fields.length < 1) {
      for (let i = props.fields.length; i < 1; i += 1) {
        props.fields.push({ key: "", value: "" });
      }
    }
  }, [props.fields]);

  return (
    <div>
      {typeof props.fields.getAll() === "object" && (
        <div>
          <FormLabel>
            {props.label} {props.isRequired && "*"}
          </FormLabel>
          {props.fields.map((field: any, index: number) => (
            <FormRowWithLabel key={index} style={{ marginTop: index ? 13 : 0 }}>
              <div style={{ width: "50vh" }}>
                {/* <FormLabel></FormLabel> */}
                <TextField name={`${field}.key`} placeholder="Key" />
              </div>

              <div style={{ marginLeft: 16 }}>
                {/* <FormLabel></FormLabel> */}
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <div style={{ marginRight: 14, width: "50vh" }}>
                    <TextField name={`${field}.value`} placeholder="Value" />
                  </div>
                  {index === props.fields.length - 1 ? (
                    <Icon
                      className="t--add-field"
                      icon="plus"
                      iconSize={20}
                      onClick={() => props.fields.push({ key: "", value: "" })}
                      color={"#A3B3BF"}
                      style={{ alignSelf: "center" }}
                    />
                  ) : (
                    <FormIcons.DELETE_ICON
                      className="t--delete-field"
                      height={20}
                      width={20}
                      color={Colors.CADET_BLUE}
                      onClick={() => props.fields.remove(index)}
                      style={{ alignSelf: "center" }}
                    />
                  )}
                </div>
              </div>
            </FormRowWithLabel>
          ))}
        </div>
      )}
    </div>
  );
};

type Props = {
  name: string;
  label: string;
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
  extraData?: ControlData[];
  isRequired?: boolean;
};

class KeyValueFieldInput extends BaseControl<KeyValueInputProps> {
  render() {
    return (
      <FieldArray
        component={KeyValueRow}
        rerenderOnEveryChange={false}
        {...this.props}
        name={this.props.configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "KEY_VAL_INPUT";
  }
}

export interface KeyValueInputProps extends ControlProps {
  name: string;
  label: string;
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
}

export default KeyValueFieldInput;
