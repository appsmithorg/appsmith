import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spinner, Text, Tooltip } from "@appsmith/ads";
import { useEventCallback, useEventListener } from "usehooks-ts";
import { usePrevious } from "@mantine/hooks";
import { useNameEditor } from "./useNameEditor";

interface EditableTextProps {
  name: string;
  isLoading?: boolean;
  onNameSave: (name: string) => void;
  isEditing: boolean;
  exitEditing: () => void;
  icon: React.ReactNode;
  inputTestId?: string;
}

export const EditableName = ({
  exitEditing,
  icon,
  inputTestId,
  isEditing,
  isLoading = false,
  name,
  onNameSave,
}: EditableTextProps) => {
  const previousName = usePrevious(name);
  const [editableName, setEditableName] = useState(name);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { normalizeName, validateName } = useNameEditor({
    entityName: name,
  });

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const nameError = validateName(editableName);

        if (nameError === null) {
          exitEditing();
          onNameSave(editableName);
        } else {
          setValidationError(nameError);
        }
      } else if (e.key === "Escape") {
        exitEditing();
        setEditableName(name);
        setValidationError(null);
      } else {
        setValidationError(null);
      }
    },
  );

  const handleTitleChange = useEventCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditableName(normalizeName(e.target.value));
    },
  );

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: inputTestId,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: { paddingTop: 0, paddingBottom: 0, left: -1, top: -1 },
    }),
    [handleKeyUp, handleTitleChange],
  );

  useEventListener(
    "focusout",
    function handleFocusOut() {
      if (isEditing) {
        const nameError = validateName(editableName);

        exitEditing();

        if (nameError === null) {
          onNameSave(editableName);
        } else {
          setEditableName(name);
          setValidationError(null);
        }
      }
    },
    inputRef,
  );

  useEffect(
    function syncEditableTitle() {
      if (!isEditing && previousName !== name) {
        setEditableName(name);
      }
    },
    [name, previousName, isEditing],
  );

  // TODO: This is a temporary fix to focus the input after context retention applies focus to its target
  // this is a nasty hack to re-focus the input after context retention applies focus to its target
  // this will be addressed in a future task, likely by a focus retention modification
  useEffect(
    function recaptureFocusInEventOfFocusRetention() {
      const input = inputRef.current;

      if (isEditing && input) {
        setTimeout(() => {
          input.focus();
        }, 200);
      }
    },
    [isEditing],
  );

  return (
    <>
      {isLoading ? <Spinner size="sm" /> : icon}
      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Text
          inputProps={inputProps}
          isEditable={isEditing}
          kind="body-s"
          ref={inputRef}
        >
          {editableName}
        </Text>
      </Tooltip>
    </>
  );
};
