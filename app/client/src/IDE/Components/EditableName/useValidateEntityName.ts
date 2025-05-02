import { useCallback } from "react";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "ee/constants/messages";
import { shallowEqual, useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getUsedActionNames } from "selectors/actionSelectors";
import { isNameValid } from "utils/helpers";

interface UseValidateEntityNameProps {
  entityName: string;
  entityId?: string;
  nameErrorMessage?: (name: string) => string;
}

/**
 * Provides a unified way to validate entity names.
 */
export function useValidateEntityName(props: UseValidateEntityNameProps) {
  const {
    entityId = "",
    entityName,
    nameErrorMessage = ACTION_NAME_CONFLICT_ERROR,
  } = props;

  const usedEntityNames = useSelector(
    (state: DefaultRootState) => getUsedActionNames(state, entityId),
    shallowEqual,
  );

  return useCallback(
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
}
