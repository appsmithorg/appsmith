import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Spinner, Text as ADSText, Tooltip } from "@appsmith/ads";
import { useEventCallback, useEventListener } from "usehooks-ts";
import { usePrevious } from "@mantine/hooks";
import { useNameEditor } from "./useNameEditor";
import styled from "styled-components";

interface EditableTextProps {
  name: string;
  /** isLoading true will show a spinner **/
  isLoading?: boolean;
  /** if a valid name is entered, the onNameSave
   * will be called with the new name */
  onNameSave: (name: string) => void;
  /** Used in conjunction with exit editing to control
   *  this component input editable state  */
  isEditing: boolean;
  /** Used in conjunction with exit editing to control this component
   *  input editable state This function will be called when the
   *  user is trying to exit the editing mode **/
  exitEditing: () => void;
  /** Icon is replaced by spinner when isLoading is shown */
  icon: React.ReactNode;
  inputTestId?: string;
}

export const Text = styled(ADSText)`
  min-width: 3ch;
`;

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

  const exitWithoutSaving = useCallback(() => {
    exitEditing();
    setEditableName(name);
    setValidationError(null);
  }, [exitEditing, name]);

  const validate = useCallback(
    (name: string) => {
      const nameError = validateName(name);

      if (nameError === null) {
        setValidationError(null);
      } else {
        setValidationError(nameError);
      }

      return nameError;
    },
    [validateName],
  );

  const attemptSave = useCallback(() => {
    const nameError = validate(editableName);

    if (editableName === name) {
      // No change detected
      exitWithoutSaving();
    } else if (nameError === null) {
      // Save the new name
      exitEditing();
      onNameSave(editableName);
    } else {
      // Exit edit mode and revert name
      exitWithoutSaving();
    }
  }, [
    editableName,
    exitEditing,
    exitWithoutSaving,
    name,
    onNameSave,
    validate,
  ]);

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        attemptSave();
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
      const input = inputRef.current;

      if (input) {
        attemptSave();
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
