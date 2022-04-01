import React, { JSXElementConstructor, useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import BaseControl, { ControlProps, ControlData } from "./BaseControl";
import TextField from "components/editorComponents/form/fields/TextField";
import { ControlType } from "constants/PropertyControlConstants";
import { Colors } from "constants/Colors";

//TODO: combine it with KeyValueArrayControl and deprecate KeyValueInputControl

type KeyValueRowProps = {
  name: string;
  label: string;
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
  extraData?: ControlData[];
  isRequired?: boolean;
};

export interface KeyValueInputControlProps extends ControlProps {
  name: string;
  label: string;
  rightIcon?: JSXElementConstructor<{ height: number; width: number }>;
  description?: string;
  actionConfig?: any;
}

const FormRowWithLabel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  & svg {
    cursor: pointer;
  }
`;

function KeyValueRow(props: KeyValueRowProps & WrappedFieldArrayProps) {
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
          {props.fields.map((field: any, index: number) => (
            <FormRowWithLabel key={index} style={{ marginTop: index ? 13 : 0 }}>
              <div
                data-replay-id={btoa(`${field}.key`)}
                style={{ width: "20vw" }}
              >
                <TextField name={`${field}.key`} placeholder="Key" />
              </div>

              <div style={{ marginLeft: 16 }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <div
                    data-replay-id={btoa(`${field}.value`)}
                    style={{ marginRight: 14, width: "20vw" }}
                  >
                    <TextField name={`${field}.value`} placeholder="Value" />
                  </div>
                  {index === props.fields.length - 1 ? (
                    <Icon
                      className="t--add-field"
                      color={"#A3B3BF"}
                      icon="plus"
                      iconSize={20}
                      onClick={() => props.fields.push({ key: "", value: "" })}
                      style={{ alignSelf: "center" }}
                    />
                  ) : (
                    <FormIcons.DELETE_ICON
                      className="t--delete-field"
                      color={Colors.CADET_BLUE}
                      height={20}
                      onClick={() => props.fields.remove(index)}
                      style={{ alignSelf: "center" }}
                      width={20}
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
}

class KeyValueFieldInputControl extends BaseControl<KeyValueInputControlProps> {
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

export default KeyValueFieldInputControl;
