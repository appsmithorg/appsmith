import React from "react";
import styled from "styled-components";
import { useFieldArray, ControllerRenderProps } from "react-hook-form";

import Disabler from "../component/Disabler";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import { ARRAY_ITEM_KEY, FIELD_PADDING_X, FIELD_PADDING_Y } from "../constants";
import { BaseFieldComponentProps } from "./types";

type ArrayComponentOwnProps = {
  isDisabled?: boolean;
};

type ArrayFieldProps = BaseFieldComponentProps<ArrayComponentOwnProps>;

const StyledWrapper = styled.div`
  padding: ${FIELD_PADDING_Y}px ${FIELD_PADDING_X}px;
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

  const { children, isVisible = true, label, props, tooltip } = schemaItem;
  const { isDisabled } = props;
  const arrayItemSchema = children[ARRAY_ITEM_KEY];

  const onAddClick = () => {
    append({ firstName: "appendBill", lastName: "appendLuo" });
  };

  const options = {
    hideLabel: true,
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Disabler isDisabled={isDisabled}>
      <FieldLabel label={label} tooltip={tooltip}>
        <StyledWrapper>
          {fields.map((field, index) => {
            const fieldName = `${name}.${index}` as ControllerRenderProps["name"];
            return (
              <StyledItemWrapper key={field.id}>
                {fieldRenderer(fieldName, arrayItemSchema, options)}
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
      </FieldLabel>
    </Disabler>
  );
}

ArrayField.componentDefaultValues = {};

export default ArrayField;
