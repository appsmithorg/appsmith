import React from "react";
import styled from "styled-components";
import { ControllerRenderProps } from "react-hook-form";

import fieldRenderer from "./fieldRenderer";
import { SchemaItem } from "../constants";

// Do not use ControllerRenderProps["name"] here for name, as it causes TS stack overflow
type ObjectFieldProps = {
  name: string;
  schemaItem: SchemaItem;
};

const WRAPPER_PADDING_Y = 10;
const WRAPPER_PADDING_X = 15;

const StyledWrapper = styled.div`
  padding: ${WRAPPER_PADDING_Y}px ${WRAPPER_PADDING_X}px;
  width: 100%;
`;

function ObjectField({ name, schemaItem }: ObjectFieldProps) {
  const children = Object.values(schemaItem.children);
  const renderFields = () => {
    return children.map((schemaItem) => {
      const fieldName = name ? `${name}.${schemaItem.name}` : schemaItem.name;

      return fieldRenderer(
        fieldName as ControllerRenderProps["name"],
        schemaItem,
      );
    });
  };

  return <StyledWrapper>{renderFields()}</StyledWrapper>;
}

ObjectField.componentDefaultValues = {};

export default ObjectField;
