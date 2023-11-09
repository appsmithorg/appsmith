import React, { useCallback } from "react";
import styled from "styled-components";
import { useFieldArray, useFormContext } from "react-hook-form";

import LabelField from "./LabelField";
import InputField from "./InputField";
import HiddenField from "./HiddenField";
import { Button } from "design-system";
import { generateNewInputGroup } from "./helper";
import type { ModuleInput } from "@appsmith/constants/ModuleConstants";

const StyledGroup = styled.div`
  margin-bottom: var(--ads-v2-spaces-3);
`;

interface InputGroupFieldProps {
  name: string;
}

function InputGroupField({ name }: InputGroupFieldProps) {
  const { control, getValues } = useFormContext();

  const { append, fields, remove } = useFieldArray({
    control,
    name,
  });

  const onDeleteClick = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  const addNewInputGroup = useCallback(() => {
    const inputGroups: ModuleInput[] = getValues(name);
    const newInputGroup = generateNewInputGroup(inputGroups);

    append(newInputGroup);
  }, [append]);

  return (
    <div>
      {fields.map((item, index) => (
        <StyledGroup key={item.id}>
          <HiddenField name={`${name}.${index}.id`} />
          <HiddenField name={`${name}.${index}.propertyName`} />
          <HiddenField name={`${name}.${index}.controlType`} />
          <LabelField
            name={`${name}.${index}.label`}
            onDeleteClick={() => onDeleteClick(index)}
          />
          <InputField
            evaluatedValueLookupPath={`${name}.${index}.label`}
            name={`${name}.${index}.defaultValue`}
          />
        </StyledGroup>
      ))}
      <Button
        data-testid="t--add-input-btn"
        kind="tertiary"
        onClick={addNewInputGroup}
        size="md"
        startIcon="plus"
      >
        Add Input
      </Button>
    </div>
  );
}

export default InputGroupField;
