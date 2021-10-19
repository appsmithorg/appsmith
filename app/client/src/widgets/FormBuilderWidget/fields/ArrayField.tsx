import React from "react";
import styled from "styled-components";
import { useFieldArray, ControllerRenderProps } from "react-hook-form";

import fieldRenderer from "./fieldRenderer";
import { BaseFieldComponentProps } from "./types";

type ArrayFieldProps = BaseFieldComponentProps;

const WRAPPER_PADDING_Y = 10;
const WRAPPER_PADDING_X = 15;

const StyledWrapper = styled.div`
  padding: ${WRAPPER_PADDING_Y}px ${WRAPPER_PADDING_X}px;
`;

const StyledItemWrapper = styled.div`
  display: flex;
  flex: 1;
`;

const StyledButton = styled.button`
  height: 30px;
  width: 80px;
`;

const StyledDeleteButton = styled(StyledButton)`
  align-self: center;
`;

function ArrayField({ name, schemaItem }: ArrayFieldProps) {
  const { append, fields, remove } = useFieldArray({
    name,
  });

  const arrayItemSchema = schemaItem.children.__array_item__;

  const onAddClick = () => {
    append({ firstName: "appendBill", lastName: "appendLuo" });
  };

  return (
    <StyledWrapper>
      {fields.map((field, index) => {
        const fieldName = `${name}.${index}` as ControllerRenderProps["name"];
        return (
          <StyledItemWrapper key={field.id}>
            {fieldRenderer(fieldName, arrayItemSchema)}
            <StyledDeleteButton onClick={() => remove(index)} type="button">
              Delete
            </StyledDeleteButton>
          </StyledItemWrapper>
        );
      })}
      <StyledButton onClick={onAddClick} type="button">
        Add
      </StyledButton>
    </StyledWrapper>
  );
}

ArrayField.componentDefaultValues = {};

export default ArrayField;
