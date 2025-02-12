import { useCallback } from "react";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "ee/constants/messages";
import { shallowEqual, useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid } from "utils/helpers";

interface UseValidateEntityNameProps {
  entityName?: string;
  nameErrorMessage?: (name: string) => string;
}

/**
 * Provides a unified way to validate entity names.
 */
export function useValidateEntityName(props: UseValidateEntityNameProps) {
  const { entityName, nameErrorMessage = ACTION_NAME_CONFLICT_ERROR } = props;

  const usedEntityNames = useSelector(
    (state: AppState) => getUsedActionNames(state, ""),
    shallowEqual,
  );

  return useCallback(
    (name: string, oldName: string | undefined = entityName): string | null => {
      if (!name || name.trim().length === 0) {
        return createMessage(ACTION_INVALID_NAME_ERROR);
      } else if (name !== oldName && !isNameValid(name, usedEntityNames)) {
        return createMessage(nameErrorMessage, name);
      }

      return null;
    },
    [entityName, nameErrorMessage, usedEntityNames],
  );
}
