import React from "react";
import styled from "styled-components";
import { ControllerRenderProps } from "react-hook-form";

import Accordion from "../component/Accordion";
import Disabler from "../component/Disabler";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import { FieldComponentBaseProps, SchemaItem } from "../constants";
import { sortBy } from "lodash";

type ObjectComponentProps = FieldComponentBaseProps;

// Note: Do not use ControllerRenderProps["name"] here for name, as it causes TS stack overflow
type ObjectFieldProps = {
  hideLabel?: boolean;
  isRootField?: boolean;
  name: string;
  propertyPath: string;
  schemaItem: SchemaItem & ObjectComponentProps;
};

type StyledWrapperProps = {
  padded: boolean;
};

const COMPONENT_DEFAULT_VALUES: ObjectComponentProps = {
  isDisabled: false,
  label: "",
  isVisible: true,
};

const StyledWrapper = styled.div<StyledWrapperProps>`
  padding-top: 0;
  width: 100%;
`;

function ObjectField({
  hideLabel,
  isRootField = false,
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

  const field = (
    <StyledWrapper padded={isRootField}>{renderFields()}</StyledWrapper>
  );

  return (
    <Disabler isDisabled={isDisabled}>
      {!hideLabel && <FieldLabel label={label} tooltip={tooltip} />}
      {isRootField ? field : <Accordion collapsible={false}>{field}</Accordion>}
    </Disabler>
  );
}

ObjectField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default ObjectField;
