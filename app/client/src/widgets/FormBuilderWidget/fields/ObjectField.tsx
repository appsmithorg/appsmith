import React from "react";
import styled from "styled-components";

import fieldRenderer from "./fieldRenderer";
import { SchemaObject } from "../constants";

type ObjectFieldProps = {
  name?: string;
  schemaObject: SchemaObject;
};

const WRAPPER_PADDING_Y = 10;
const WRAPPER_PADDING_X = 15;

const StyledWrapper = styled.div`
  padding: ${WRAPPER_PADDING_Y}px ${WRAPPER_PADDING_X}px;
  width: 100%;
`;

function ObjectField({ name, schemaObject }: ObjectFieldProps) {
  const entries = Object.entries(schemaObject.children);

  const renderFields = () => {
    return entries.map(([key, value]) => {
      const fieldName = name ? `${name}.${key}` : key;

      return fieldRenderer(fieldName, value);
    });
  };

  return <StyledWrapper>{renderFields()}</StyledWrapper>;
}

export default ObjectField;
