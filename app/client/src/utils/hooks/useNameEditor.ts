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
import { useEventCallback } from "usehooks-ts";

interface NameSaveActionParams {
  name: string;
  id: string;
}

interface UseNameEditorProps {
  entityId: string;
  entityName: string;
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
  const {
    entityId,
    entityName,
    nameErrorMessage = ACTION_NAME_CONFLICT_ERROR,
    nameSaveAction,
  } = props;

  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";

  const usedEntityNames = useSelector(
    (state: AppState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  const validateName = useEventCallback((name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return createMessage(ACTION_INVALID_NAME_ERROR);
    } else if (name !== entityName && !isNameValid(name, usedEntityNames)) {
      return createMessage(nameErrorMessage, name);
    }

    return null;
  });

  const handleNameSave = useEventCallback((name: string) => {
    if (name !== entityName && validateName(name) === null) {
      dispatch(nameSaveAction({ id: entityId, name }));
    }
  });

  return {
    isNew,
    validateName,
    handleNameSave,
    normalizeName: removeSpecialChars,
  };
}
