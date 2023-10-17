import { useEffect, useState, useCallback, memo } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { isNameValid } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";
import log from "loglevel";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { getUsedActionNames } from "selectors/actionSelectors";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "@appsmith/constants/messages";

interface NameEditorProps {
  checkForGuidedTour?: boolean;
  children: (params: any) => JSX.Element;
  id?: string;
  name?: string;
  dispatchAction: (a: any) => any;
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
    checkForGuidedTour,
    dispatchAction,
    id: entityId,
    idUndefinedErrorMessage,
    name: entityName,
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
  const guidedTourEnabled = useSelector(inGuidedTour);

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
      if (name !== entityName && !isInvalidNameForEntity(name)) {
        if (checkForGuidedTour && guidedTourEnabled) {
          dispatch(toggleShowDeviationDialog(true));
          return;
        }

        dispatch(dispatchAction({ id: entityId, name }));
      }
    },
    [dispatch, isInvalidNameForEntity, guidedTourEnabled, entityId, entityName],
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
