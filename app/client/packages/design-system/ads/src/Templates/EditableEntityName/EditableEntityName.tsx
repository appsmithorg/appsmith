import React, { useMemo } from "react";

import { Spinner, Tooltip } from "../..";
import { useEditableText } from "../../__hooks__";

import * as Styled from "./EditableEntityName.styles";

import type { EditableEntityNameProps } from "./EditableEntityName.types";

export const EditableEntityName = ({
  icon,
  inputTestId,
  isEditing,
  isLoading = false,
  name,
  onExitEditing,
  onNameSave,
  validateName,
}: EditableEntityNameProps) => {
  const [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ] = useEditableText(isEditing, name, onExitEditing, validateName, onNameSave);

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: inputTestId,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: {
        paddingTop: 4,
        paddingBottom: 4,
        left: -1,
        top: -5,
      },
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  return (
    <Styled.Root>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Styled.IconContainer>{icon}</Styled.IconContainer>
      )}
      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Styled.Text
          aria-invalid={Boolean(validationError)}
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={isEditing}
          kind="body-s"
        >
          {editableName}
        </Styled.Text>
      </Tooltip>
    </Styled.Root>
  );
};
