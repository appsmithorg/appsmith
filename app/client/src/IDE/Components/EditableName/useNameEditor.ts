import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "ee/constants/messages";
import { shallowEqual, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid, removeSpecialChars } from "utils/helpers";
import { useCallback } from "react";

interface UseNameEditorProps {
  entityName: string;
  nameErrorMessage?: (name: string) => string;
}

/**
 * Provides a unified way to validate and save entity names.
 */
export function useNameEditor(props: UseNameEditorProps) {
  const { entityName, nameErrorMessage = ACTION_NAME_CONFLICT_ERROR } = props;

  const usedEntityNames = useSelector(
    (state: AppState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  const validateName = useCallback(
    (name: string): string | null => {
      if (!name || name.trim().length === 0) {
        return createMessage(ACTION_INVALID_NAME_ERROR);
      } else if (name !== entityName && !isNameValid(name, usedEntityNames)) {
        return createMessage(nameErrorMessage, name);
      }

      return null;
    },
    [entityName, nameErrorMessage, usedEntityNames],
  );

  return {
    validateName,
    normalizeName: removeSpecialChars,
  };
}
