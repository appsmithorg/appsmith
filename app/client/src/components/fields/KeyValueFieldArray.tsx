import React from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "../../icons/FormIcons";
import TextField from "./TextField";
import FormRow from "../editor/FormRow";
import FormLabel from "../editor/FormLabel";
import styled from "styled-components";

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
  return (
    <React.Fragment>
      {props.fields.map((field: any, index: number) => (
        <FormRowWithLabel key={index}>
          {index === 0 && <FormLabel>{props.label}</FormLabel>}
          <TextField name={`${field}.key`} placeholderMessage="Key" />
          <TextField name={`${field}.value`} placeholderMessage="Value" />
          {index === props.fields.length - 1 ? (
            <Icon
              icon="plus"
              iconSize={20}
              onClick={() => props.fields.push({ key: "", value: "" })}
              color={"#A3B3BF"}
            />
          ) : (
            <FormIcons.DELETE_ICON
              height={20}
              width={20}
              onClick={() => props.fields.remove(index)}
            />
          )}
        </FormRowWithLabel>
      ))}
    </React.Fragment>
  );
};

type Props = {
  name: string;
  label: string;
};

const KeyValueFieldArray = (props: Props) => {
  return <FieldArray name={props.name} component={KeyValueRow} {...props} />;
};

export default KeyValueFieldArray;
