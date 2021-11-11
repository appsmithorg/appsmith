import React from "react";
import styled from "styled-components";
import { ControllerRenderProps } from "react-hook-form";

import Disabler from "../component/Disabler";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import { SchemaItem } from "../constants";
import { sortBy } from "lodash";

// Note: Do not use ControllerRenderProps["name"] here for name, as it causes TS stack overflow
type ObjectFieldProps = {
  name: string;
  propertyPath: string;
  schemaItem: SchemaItem & {
    isDisabled: boolean;
  };
  hideLabel?: boolean;
};

const WRAPPER_PADDING_X = 15;
const WRAPPER_PADDING_Y = 10;

const StyledWrapper = styled.div`
  padding: ${WRAPPER_PADDING_Y}px ${WRAPPER_PADDING_X}px;
  padding-top: 0;
  width: 100%;
`;

function ObjectField({
  hideLabel,
  name,
  propertyPath,
  schemaItem,
}: ObjectFieldProps) {
  const { isDisabled, isVisible = true, label, tooltip } = schemaItem;
  const children = Object.values(schemaItem.children);
  const sortedChildren = sortBy(children, ({ position }) => position);

  if (!isVisible) {
    return null;
  }

  const renderFields = () => {
    return sortedChildren.map((schemaItem) => {
      const fieldName = name ? `${name}.${schemaItem.name}` : schemaItem.name;
      const fieldPropertyPath = `${propertyPath}.children.${schemaItem.name}`;

      return fieldRenderer(
        fieldName as ControllerRenderProps["name"],
        schemaItem,
        fieldPropertyPath,
      );
    });
  };

  return (
    <Disabler isDisabled={isDisabled}>
      {!hideLabel && <FieldLabel label={label} tooltip={tooltip} />}
      <StyledWrapper>{renderFields()}</StyledWrapper>
    </Disabler>
  );
}

ObjectField.componentDefaultValues = {};

export default ObjectField;
