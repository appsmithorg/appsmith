import React, { useMemo } from "react";
import { Spinner, Tooltip } from "@appsmith/ads";

import { Icon, useEditableText } from "@appsmith/ads";

import * as Styled from "./EditableEntityName.styles";

interface EditableTextProps {
  iconName: string;
  inputTestId?: string;
  isEditing: boolean;
  isLoading?: boolean;
  name: string;
  onExitEditing: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
}

export const EditableEntityName = ({
  iconName,
  inputTestId,
  isEditing,
  isLoading = false,
  name,
  onExitEditing,
  onNameSave,
  validateName,
}: EditableTextProps) => {
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
      style: { paddingTop: 0, paddingBottom: 0, left: -1, top: -1 },
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  return (
    <Styled.Root>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <Styled.IconContainer>
          <Icon name={iconName} />
        </Styled.IconContainer>
      )}
      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Styled.Text
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
