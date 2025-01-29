import React, { useMemo } from "react";

import { Spinner, Tooltip } from "../..";
import { useEditableText } from "../../__hooks__";

import * as Styled from "./EditableEntityName.styles";

import type { EditableEntityNameProps } from "./EditableEntityName.types";

export const EditableEntityName = (props: EditableEntityNameProps) => {
  const {
    canEdit,
    gap = "var(--ads-v2-spaces-2)",
    inputTestId,
    isEditing,
    isFixedWidth,
    isLoading,
    name,
    onEditComplete,
    onNameSave,
    textKind,
    validateName,
  } = props;

  const inEditMode = canEdit ? isEditing : false;

  const [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ] = useEditableText(
    inEditMode,
    name,
    onEditComplete,
    validateName,
    onNameSave,
  );

  // When in loading state, start icon becomes the loading icon
  const startIcon = useMemo(() => {
    if (isLoading) {
      return <Spinner size="md" />;
    }

    return props.startIcon;
  }, [isLoading, props.startIcon]);

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: inputTestId,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  return (
    <Styled.Root gap={gap}>
      {startIcon}
      <Tooltip
        content={validationError}
        placement="bottom"
        visible={Boolean(validationError)}
      >
        <Styled.Text
          aria-invalid={Boolean(validationError)}
          data-isediting={inEditMode}
          data-isfixedwidth={isFixedWidth}
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={inEditMode}
          kind={textKind || "body-s"}
        >
          {editableName}
        </Styled.Text>
      </Tooltip>
    </Styled.Root>
  );
};
