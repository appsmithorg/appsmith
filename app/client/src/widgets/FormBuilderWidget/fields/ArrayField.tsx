import React from "react";
import styled from "styled-components";
import { ControllerRenderProps, useFieldArray } from "react-hook-form";

import fieldRenderer from "./fieldRenderer";
import { SchemaItem } from "../constants";

type FieldArrayProps = {
  name: ControllerRenderProps["name"];
  schemaItem: SchemaItem;
};

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

function FieldArray({ name, schemaItem }: FieldArrayProps) {
  const { append, fields, remove } = useFieldArray({
    name,
  });

  const [arrayItemSchema] = schemaItem.children;

  const onAddClick = () => {
    append({ firstName: "appendBill", lastName: "appendLuo" });
  };
  // eslint-disable-next-line
  console.log("ARRAY fields", fields);

  return (
    <StyledWrapper>
      {fields.map((field, index) => (
        <StyledItemWrapper key={field.id}>
          {fieldRenderer(`${name}.${index}`, arrayItemSchema)}
          <StyledDeleteButton onClick={() => remove(index)} type="button">
            Delete
          </StyledDeleteButton>
        </StyledItemWrapper>
      ))}
      <StyledButton onClick={onAddClick} type="button">
        Add
      </StyledButton>
    </StyledWrapper>
  );
}

export default FieldArray;
