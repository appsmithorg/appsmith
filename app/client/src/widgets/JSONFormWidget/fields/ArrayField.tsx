import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ControllerRenderProps, useFormContext } from "react-hook-form";

import Disabler from "../component/Disabler";
import FieldLabel from "../component/FieldLabel";
import fieldRenderer from "./fieldRenderer";
import {
  ARRAY_ITEM_KEY,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FIELD_PADDING_X,
  FIELD_PADDING_Y,
} from "../constants";
import { generateReactKey } from "utils/generators";

type ArrayComponentProps = FieldComponentBaseProps;

type ArrayFieldProps = BaseFieldComponentProps<ArrayComponentProps>;

const COMPONENT_DEFAULT_VALUES: ArrayComponentProps = {
  isDisabled: false,
  label: "",
  isVisible: true,
};

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
function ArrayField({ name, propertyPath, schemaItem }: ArrayFieldProps) {
  const formMethods = useFormContext();
  const [keys, setKeys] = useState<string[]>([]);

  const { children, isDisabled, isVisible = true, label, tooltip } = schemaItem;
  const arrayItemSchema = children[ARRAY_ITEM_KEY];
  const basePropertyPath = `${propertyPath}.children.${ARRAY_ITEM_KEY}`;

  const add = () => {
    setKeys((prevKeys) => [...prevKeys, generateReactKey()]);
  };

  useEffect(() => {
    add();
    add();
  }, []);

  const remove = (removedKey: string) => {
    const removedIndex = keys.findIndex((key) => key === removedKey);
    const values = formMethods.getValues(name);

    if (values === undefined) {
      return;
    }

    // Manually remove from the values and re-insert to maintain the position of the
    // values
    const newValues = values.filter(
      (_val: any, index: number) => index !== removedIndex,
    );

    formMethods.setValue(name, newValues);

    setKeys((prevKeys) => prevKeys.filter((prevKey) => prevKey !== removedKey));
  };

  const options = {
    hideLabel: true,
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Disabler isDisabled={isDisabled}>
      <FieldLabel label={label} tooltip={tooltip} />
      <StyledWrapper>
        {keys.map((key, index) => {
          const fieldName = `${name}.${index}` as ControllerRenderProps["name"];
          const fieldPropertyPath = `${basePropertyPath}.children.${arrayItemSchema.name}`;

          return (
            <StyledItemWrapper key={key}>
              {fieldRenderer(
                fieldName,
                arrayItemSchema,
                fieldPropertyPath,
                options,
              )}
              <StyledDeleteButton onClick={() => remove(key)} type="button">
                Delete
              </StyledDeleteButton>
            </StyledItemWrapper>
          );
        })}
        <StyledButton onClick={() => add()} type="button">
          Add
        </StyledButton>
      </StyledWrapper>
    </Disabler>
  );
}

ArrayField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default ArrayField;
