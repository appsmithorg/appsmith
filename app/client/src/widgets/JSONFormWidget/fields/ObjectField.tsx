import React, { useMemo } from "react";
import styled from "styled-components";
import { ControllerRenderProps } from "react-hook-form";
import { sortBy } from "lodash";

import Accordion from "../component/Accordion";
import FieldLabel from "../component/FieldLabel";
import FieldRenderer from "./FieldRenderer";
import NestedFormWrapper from "../component/NestedFormWrapper";
import useUpdateAccessor from "./useObserveAccessor";
import { FIELD_MARGIN_BOTTOM } from "../component/styleConstants";
import {
  BaseFieldComponentProps,
  FieldComponent,
  FieldComponentBaseProps,
} from "../constants";

type ObjectComponentProps = FieldComponentBaseProps & {
  backgroundColor?: string;
  cellBackgroundColor?: string;
  cellBorderColor?: string;
};

// Note: Do not use ControllerRenderProps["name"] here for name, as it causes TS stack overflow
type ObjectFieldProps = Omit<
  BaseFieldComponentProps<ObjectComponentProps>,
  "name"
> & {
  hideAccordion?: boolean;
  name: string;
};

type StyledWrapperProps = {
  withBottomMargin: boolean;
};

const COMPONENT_DEFAULT_VALUES: ObjectComponentProps = {
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
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
  fieldClassName,
  hideAccordion = false,
  hideLabel,
  isRootField = false,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: ObjectFieldProps) {
  const {
    accessor,
    backgroundColor,
    cellBackgroundColor,
    cellBorderColor,
    isVisible = true,
    label,
    tooltip,
  } = schemaItem;

  useUpdateAccessor({ accessor });

  const objectPassedDefaultValue = useMemo(() => {
    let defaultValue: Record<string, unknown> = {};
    if (passedDefaultValue && typeof passedDefaultValue === "object") {
      defaultValue = passedDefaultValue as Record<string, unknown>;
    }

    return defaultValue;
  }, [passedDefaultValue]);

  const fields = useMemo(() => {
    const children = Object.values(schemaItem.children);
    const sortedChildren = sortBy(children, ({ position }) => position);

    return sortedChildren.map((schemaItem) => {
      const fieldName = name
        ? `${name}.${schemaItem.identifier}`
        : schemaItem.identifier;
      const fieldPropertyPath = `${propertyPath}.children.${schemaItem.identifier}`;

      return (
        <FieldRenderer
          fieldName={fieldName as ControllerRenderProps["name"]}
          key={schemaItem.identifier}
          passedDefaultValue={objectPassedDefaultValue[schemaItem.accessor]}
          propertyPath={fieldPropertyPath}
          schemaItem={schemaItem}
        />
      );
    });
  }, [
    schemaItem,
    name,
    schemaItem.identifier,
    propertyPath,
    objectPassedDefaultValue,
  ]);

  if (!isVisible) {
    return null;
  }

  const field = <StyledFieldsWrapper>{fields}</StyledFieldsWrapper>;

  return (
    <StyledWrapper
      className={`t--jsonformfield-${fieldClassName}`}
      withBottomMargin={!hideAccordion}
    >
      <NestedFormWrapper
        backgroundColor={isRootField ? "transparent" : backgroundColor}
        withoutPadding={isRootField}
      >
        {!hideLabel && <FieldLabel label={label} tooltip={tooltip} />}
        {isRootField || hideAccordion ? (
          field
        ) : (
          <Accordion
            backgroundColor={cellBackgroundColor}
            borderColor={cellBorderColor}
            isCollapsible={false}
          >
            {field}
          </Accordion>
        )}
      </NestedFormWrapper>
    </StyledWrapper>
  );
}

const MemoedObjectField: FieldComponent = React.memo(ObjectField);
MemoedObjectField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default MemoedObjectField;
