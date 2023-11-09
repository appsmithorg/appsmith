import React, { useCallback } from "react";
import styled from "styled-components";
import { useController } from "react-hook-form";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Button } from "design-system";
import {
  INVALID_INPUT_NAME,
  createMessage,
} from "@appsmith/constants/messages";

export interface LabelFieldProps {
  name: string;
  onDeleteClick: () => void;
}

const DELETE_BUTTON_WIDTH = 34;

const StyledWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  // hardcoding this value to the max size of the EditableText to avoid vertical jitter
  height: 36px;

  & > div {
    width: calc(100% - ${DELETE_BUTTON_WIDTH}px) !important;
  }

  & > div > div {
    width: 100%;
  }
`;

const StyledEditableText = styled(EditableText)`
  width: 100% !important;
`;

function isValidObjectKey(str: string): boolean {
  // Regular expression to check if the string is a valid object key
  const validKeyRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  // Test the string against the regular expression
  return validKeyRegex.test(str);
}

function FieldLabel({ name, onDeleteClick }: LabelFieldProps) {
  const {
    field: { onBlur, onChange, value },
  } = useController({
    name,
  });

  const isInvalid = useCallback((value: string) => {
    const isValueInvalid = !isValidObjectKey(value);

    if (isValueInvalid) {
      return createMessage(INVALID_INPUT_NAME);
    } else {
      return false;
    }
  }, []);

  return (
    <StyledWrapper>
      <StyledEditableText
        defaultValue={value}
        editInteractionKind={EditInteractionKind.SINGLE}
        isInvalid={isInvalid}
        onBlur={onBlur}
        onTextChanged={onChange}
        placeholder=""
        type="text"
      />
      <Button
        data-testid="t--delete-input-btn"
        kind="tertiary"
        onClick={onDeleteClick}
        startIcon="trash"
      />
    </StyledWrapper>
  );
}

export default FieldLabel;
