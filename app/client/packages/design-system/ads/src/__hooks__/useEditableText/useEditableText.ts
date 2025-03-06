import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEvent,
  type ChangeEvent,
  useRef,
  type RefObject,
} from "react";

import { usePrevious } from "@mantine/hooks";
import { useEventCallback, useEventListener } from "usehooks-ts";

import { normaliseName } from "./utils";

export function useEditableText(
  isEditing: boolean,
  name: string,
  exitEditing: () => void,
  validateName: (name: string) => string | null,
  onNameSave: (name: string) => void,
  normalizeName?: boolean,
): [
  RefObject<HTMLInputElement>,
  string,
  string | null,
  (e: KeyboardEvent<HTMLInputElement>) => void,
  (e: ChangeEvent<HTMLInputElement>) => void,
] {
  const previousName = usePrevious(name);
  const [editableName, setEditableName] = useState(name);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleKeyUp = useEventCallback((e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === "Enter") {
      attemptSave();
    } else if (e.key === "Escape") {
      exitWithoutSaving();
    }
  });

  const handleTitleChange = useEventCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = normalizeName
        ? normaliseName(e.target.value)
        : e.target.value;

      setEditableName(value);
      validate(value);
    },
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

  return [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ];
}
