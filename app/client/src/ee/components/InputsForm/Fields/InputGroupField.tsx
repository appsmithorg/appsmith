import React, { useCallback, useContext } from "react";
import styled from "styled-components";
import { useFieldArray, useFormContext } from "react-hook-form";

import type { ValidateProps } from "./LabelField";
import LabelField from "./LabelField";
import InputField from "./InputField";
import HiddenField from "./HiddenField";
import { Button } from "design-system";
import { generateNewInputGroup } from "./helper";
import type { ModuleInput } from "@appsmith/constants/ModuleConstants";
import {
  INVALID_INPUT_NAME,
  UNIQUE_INPUT_NAME,
  createMessage,
} from "@appsmith/constants/messages";
import { InputsFormContext } from "../InputsFormContext";

const StyledGroup = styled.div`
  margin-bottom: var(--ads-v2-spaces-3);
`;

interface InputGroupFieldProps {
  name: string;
}

type ModuleInputField = ModuleInput & {
  key: string;
};

function isValidObjectKey(str: string): boolean {
  // Regular expression to check if the string is a valid object key
  const validKeyRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  // Test the string against the regular expression
  return validKeyRegex.test(str);
}

function InputGroupField({ name }: InputGroupFieldProps) {
  const { control, getValues } = useFormContext();
  const { dataTreePathPrefix, evaluatedValues } = useContext(InputsFormContext);
  const { append, fields, remove } = useFieldArray({
    control,
    name,
    keyName: "key",
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

  const validateLabel = useCallback(
    ({ id, value }: ValidateProps) => {
      const isFormatInvalid = !isValidObjectKey(value);
      const inputGroups: ModuleInput[] = getValues(name);
      const isDuplicateLabel = inputGroups.some(
        (ig) => ig.label === value && id !== ig.id,
      );

      if (isFormatInvalid) {
        return { error: createMessage(INVALID_INPUT_NAME) };
      }

      if (isDuplicateLabel) {
        return { error: createMessage(UNIQUE_INPUT_NAME) };
      }

      return {};
    },
    [name, getValues],
  );

  const evalLookup = (lookupPath: string) => {
    const evalKey = getValues(lookupPath);
    return { evaluatedValue: evaluatedValues?.[evalKey], evalKey };
  };

  return (
    <div>
      {(fields as ModuleInputField[]).map((item, index) => {
        const { evalKey, evaluatedValue } = evalLookup(
          `${name}.${index}.label`,
        );
        return (
          <StyledGroup key={item.key}>
            <HiddenField name={`${name}.${index}.id`} />
            <HiddenField name={`${name}.${index}.propertyName`} />
            <HiddenField name={`${name}.${index}.controlType`} />
            <LabelField
              id={item.id}
              name={`${name}.${index}.label`}
              onDeleteClick={() => onDeleteClick(index)}
              validate={validateLabel}
            />
            <InputField
              dataTreePath={`${dataTreePathPrefix}.${evalKey}`}
              evaluatedValue={evaluatedValue}
              name={`${name}.${index}.defaultValue`}
            />
          </StyledGroup>
        );
      })}
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
