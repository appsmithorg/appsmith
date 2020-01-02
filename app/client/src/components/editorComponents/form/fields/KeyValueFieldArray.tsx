import React, { useEffect } from "react";
import { FieldArray, WrappedFieldArrayProps } from "redux-form";
import { Icon } from "@blueprintjs/core";
import { FormIcons } from "icons/FormIcons";
import DynamicTextField from "./DynamicTextField";
import FormRow from "components/editorComponents/FormRow";
import FormLabel from "components/editorComponents/FormLabel";
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
  useEffect(() => {
    // Always maintain 2 rows
    if (props.fields.length < 2) {
      for (let i = props.fields.length; i < 2; i += 1) {
        props.fields.push({ key: "", value: "" });
      }
    }
  }, [props.fields]);

  return (
    <React.Fragment>
      {props.fields.map((field: any, index: number) => (
        <FormRowWithLabel key={index}>
          {index === 0 && <FormLabel>{props.label}</FormLabel>}
          <DynamicTextField
            name={`${field}.key`}
            placeholder="Key"
            initialHeight={32}
          />
          <DynamicTextField
            name={`${field}.value`}
            placeholder="Value"
            initialHeight={32}
          />
          {index === props.fields.length - 1 ? (
            <Icon
              icon="plus"
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
