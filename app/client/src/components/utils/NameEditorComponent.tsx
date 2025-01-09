import { useEffect, useState, useCallback, memo } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { isNameValid } from "utils/helpers";
import type { AppState } from "ee/reducers";
import log from "loglevel";
import { getUsedActionNames } from "selectors/actionSelectors";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "ee/constants/messages";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { ReduxAction } from "../../actions/ReduxActionTypes";

export const NameWrapper = styled.div<{ enableFontStyling?: boolean }>`
  min-width: 50%;
  margin-right: 10px;
  display: flex;
  justify-content: flex-start;
  align-content: center;
  & > div {
    max-width: 100%;
    flex: 0 1 auto;
    font-size: ${(props) => props.theme.fontSizes[5]}px;
    font-weight: ${(props) => props.theme.fontWeights[2]};
  }

  ${(props) =>
    props.enableFontStyling
      ? `  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
  font-size: ${props.theme.typography.h3.fontSize}px;
  letter-spacing: ${props.theme.typography.h3.letterSpacing}px;
  font-weight: ${props.theme.typography.h3.fontWeight};
}`
      : null}

  & .t--action-name-edit-field, & .t--js-action-name-edit-field, & .t--module-instance-name-edit-field {
    width: 100%;

    & > span {
      display: inline-block;
    }
  }

  & > div > div:nth-child(2) {
    width: calc(100% - 42px); // 32px icon width and 8px gap of flex
  }

  & > div > div:nth-child(2) > :first-child {
    width: 100%;
  }
`;

export const IconWrapper = styled.img`
  width: 34px;
  height: auto;
`;

export const IconBox = styled.div`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

interface NameEditorProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (params: any) => JSX.Element;
  id?: string;
  name?: string;
  onSaveName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suffixErrorMessage?: (params?: any) => string;
  idUndefinedErrorMessage: string;
  saveStatus: { isSaving: boolean; error: boolean };
}

/**
 * It is wrapper component using render props method.
 * This Component is used to make a common function for changing the names of the entities, page, widget, js objects etc with the single point of logic.
 * This code is memoized for usage to optimise the application.
 * This passes down different properties as well as functions to the wrapped component (a function which is present inside the children property of props).
 */

function NameEditor(props: NameEditorProps) {
  const {
    id: entityId,
    idUndefinedErrorMessage,
    name: entityName,
    onSaveName,
    saveStatus,
    suffixErrorMessage = ACTION_NAME_CONFLICT_ERROR,
  } = props;
  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();

  if (!entityId) {
    log.error(idUndefinedErrorMessage);
  }

  const conflictingNames = useSelector(
    (state: AppState) => getUsedActionNames(state, entityId || ""),
    shallowEqual,
  );

  const hasActionNameConflict = useCallback(
    (name: string) => !isNameValid(name, conflictingNames),
    [conflictingNames],
  );

  const isInvalidNameForEntity = useCallback(
    (name: string): string | boolean => {
      if (!name || name.trim().length === 0) {
        return createMessage(ACTION_INVALID_NAME_ERROR);
      } else if (name !== entityName && hasActionNameConflict(name)) {
        return createMessage(suffixErrorMessage, name);
      }

      return false;
    },
    [hasActionNameConflict, entityName],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      if (name !== entityName && !isInvalidNameForEntity(name) && entityId) {
        dispatch(onSaveName({ id: entityId, name }));
      }
    },
    [dispatch, isInvalidNameForEntity, entityId, entityName],
  );

  useEffect(() => {
    if (saveStatus.isSaving === false && saveStatus.error === true) {
      setForceUpdate(true);
    } else if (saveStatus.isSaving === true) {
      setForceUpdate(false);
    } else if (saveStatus.isSaving === false && saveStatus.error === false) {
      // Construct URLSearchParams object instance from current URL querystring.
      const queryParams = new URLSearchParams(window.location.search);

      if (
        queryParams.has("editName") &&
        queryParams.get("editName") === "true"
      ) {
        // Set new or modify existing parameter value.
        queryParams.set("editName", "false");
        // Replace current querystring with the new one.
        history.replaceState({}, "", "?" + queryParams.toString());
      }
    }
  }, [saveStatus.isSaving, saveStatus.error]);

  return props.children({
    forceUpdate,
    isNew,
    isInvalidNameForEntity,
    handleNameChange,
    saveStatus,
  });
}

export default memo(NameEditor);
