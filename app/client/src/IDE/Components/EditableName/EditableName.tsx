import React, { useEffect, useMemo, useRef, useState } from "react";
import { Spinner, Text, Tooltip } from "@appsmith/ads";
import { useEventCallback, useEventListener } from "usehooks-ts";
import { usePrevious } from "@mantine/hooks";
import { useNameEditor } from "./useNameEditor";

interface EditableTextProps {
  name: string;
  /** isLoading true will show a spinner **/
  isLoading?: boolean;
  onNameSave: (name: string) => void;
  /** Used in conjunction with exit editing to control
   *  this component input editable state  */
  isEditing: boolean;
  /** When this is true, the exit out
   *  of edit mode will be blocked till the
   *  user has a keyboard interaction **/
  needsInteractionBeforeExit?: boolean;
  /** Used in conjunction with exit editing to control this component
   *  input editable state This function will be called when the
   *  user is trying to exit the editing mode. This can be
   *  restricted by the needsInteractionBeforeExit prop **/
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
  needsInteractionBeforeExit,
  onNameSave,
}: EditableTextProps) => {
  const previousName = usePrevious(name);
  const [editableName, setEditableName] = useState(name);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { normalizeName, validateName } = useNameEditor({
    entityName: name,
  });

  const attemptSave = () => {
    const nameError = validateName(editableName);

    if (nameError === null) {
      exitEditing();
      onNameSave(editableName);
    }
  };

  const exitWithoutSaving = () => {
    exitEditing();
    setEditableName(name);
    setValidationError(null);
  };

  const validate = (name: string) => {
    const nameError = validateName(name);

    if (nameError === null) {
      setValidationError(null);
    } else {
      setValidationError(nameError);
    }
  };

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      setHasInteracted(true);

      if (e.key === "Enter") {
        if (editableName === name) {
          exitWithoutSaving();
        } else {
          attemptSave();
        }
      } else if (e.key === "Escape") {
        exitWithoutSaving();
      }
    },
  );

  const handleTitleChange = useEventCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = normalizeName(e.target.value);

      setEditableName(value);
      validate(value);
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
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  useEventListener(
    "focusout",
    function handleFocusOut() {
      if (isEditing) {
        if (!hasInteracted && needsInteractionBeforeExit) {
          // Refocus the input to ensure the user interacts with the input before exiting
          inputRef.current?.focus();
        } else {
          exitWithoutSaving();
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
        }, 400);
      } else {
        setHasInteracted(false);
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
          inputRef={inputRef}
          isEditable={isEditing}
          kind="body-s"
        >
          {editableName}
        </Text>
      </Tooltip>
    </>
  );
};
