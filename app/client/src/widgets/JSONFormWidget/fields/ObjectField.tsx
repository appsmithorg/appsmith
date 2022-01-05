import React from "react";
import styled from "styled-components";
import { ControllerRenderProps } from "react-hook-form";
import { sortBy } from "lodash";

import Accordion from "../component/Accordion";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import { FIELD_MARGIN_BOTTOM } from "../component/styleConstants";
import { FieldComponentBaseProps, SchemaItem } from "../constants";

type ObjectComponentProps = FieldComponentBaseProps;

// Note: Do not use ControllerRenderProps["name"] here for name, as it causes TS stack overflow
type ObjectFieldProps = {
  backgroundColor?: string;
  borderColor?: string;
  hideAccordion?: boolean;
  hideLabel?: boolean;
  isRootField?: boolean;
  name: string;
  propertyPath: string;
  schemaItem: SchemaItem & ObjectComponentProps;
};

type StyledWrapperProps = {
  withBottomMargin: boolean;
};

const COMPONENT_DEFAULT_VALUES: ObjectComponentProps = {
  isDisabled: false,
  label: "",
  isVisible: true,
};

const StyledFieldsWrapper = styled.div`
  padding-top: 0;
  width: 100%;
`;

const StyledWrapper = styled.div<StyledWrapperProps>`
  margin-bottom: ${({ withBottomMargin }) =>
    withBottomMargin ? FIELD_MARGIN_BOTTOM : 0}px;
`;

function ObjectField({
  backgroundColor,
  borderColor,
  hideAccordion = false,
  hideLabel,
  isRootField = false,
  name,
  propertyPath,
  schemaItem,
}: ObjectFieldProps) {
  const { isVisible = true, label, tooltip } = schemaItem;
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

  const field = <StyledFieldsWrapper>{renderFields()}</StyledFieldsWrapper>;

  return (
    <StyledWrapper
      className={`t--jsonformfield-${name}`}
      withBottomMargin={!hideAccordion}
    >
      {!hideLabel && <FieldLabel label={label} tooltip={tooltip} />}
      {isRootField || hideAccordion ? (
        field
      ) : (
        <Accordion
          backgroundColor={backgroundColor}
          borderColor={borderColor}
          isCollapsible={false}
        >
          {field}
        </Accordion>
      )}
    </StyledWrapper>
  );
}

ObjectField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default ObjectField;
