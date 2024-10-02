import { useCallback } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { isNameValid, removeSpecialChars } from "utils/helpers";
import type { AppState } from "ee/reducers";

import { getUsedActionNames } from "selectors/actionSelectors";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "ee/constants/messages";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";

interface NameSaveActionParams {
  name: string;
  id: string;
}

interface UseNameEditorProps {
  nameSaveAction: (
    params: NameSaveActionParams,
  ) => ReduxAction<NameSaveActionParams>;
  nameErrorMessage?: (name: string) => string;
}

/**
 * Provides a unified way to validate and save entity names.
 */
export function useNameEditor(props: UseNameEditorProps) {
  const dispatch = useDispatch();

  const { nameErrorMessage = ACTION_NAME_CONFLICT_ERROR, nameSaveAction } =
    props;

  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";

  const usedEntityNames = useSelector(
    (state: AppState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  const validateName = useCallback(
    (entityName: string) =>
      (name: string): string | null => {
        if (!name || name.trim().length === 0) {
          return createMessage(ACTION_INVALID_NAME_ERROR);
        } else if (name !== entityName && !isNameValid(name, usedEntityNames)) {
          return createMessage(nameErrorMessage, name);
        }

        return null;
      },
    [nameErrorMessage, usedEntityNames],
  );

  const handleNameSave = useCallback(
    (entityName: string, entityId: string) => (name: string) => {
      if (name !== entityName && validateName(entityName)(name) === null) {
        dispatch(nameSaveAction({ id: entityId, name }));
      }
    },
    [validateName, dispatch, nameSaveAction],
  );

  return {
    isNew,
    validateName,
    handleNameSave,
    normalizeName: removeSpecialChars,
  };
}
