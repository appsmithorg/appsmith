import { useEffect, useState, useCallback, memo } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";

import { isNameValid } from "utils/helpers";
import { AppState } from "reducers";

import log from "loglevel";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { toggleShowDeviationDialog } from "actions/onboardingActions";
import {
  getUsedActionNames,
  getSavingStatusForActionName,
  getSavingStatusForJSObjectName,
} from "selectors/actionSelectors";
import {
  ACTION_INVALID_NAME_ERROR,
  ACTION_NAME_CONFLICT_ERROR,
  createMessage,
} from "@appsmith/constants/messages";
import { PluginType } from "entities/Action";

type NameEditorProps = {
  checkForGuidedTour?: boolean;
  children: (params: any) => JSX.Element;
  currentActionConfig: { id: string; name: string } | undefined;
  dispatchAction: (a: any) => any;
  suffixErrorMessage?: (params?: any) => string;
  pluginType?: PluginType;
};

/**
 * It is wrapper component using render props method.
 * This Component is used to make a common function for changing the names of the entities, page, widget, js objects etc with the single point of logic.
 * This code is memoized for usage to optimise the application.
 * This passes down different properties as well as functions to the wrapped component (a function which is present inside the children property of props).
 */

function NameEditor(props: NameEditorProps) {
  const {
    checkForGuidedTour,
    currentActionConfig,
    dispatchAction,
    suffixErrorMessage = ACTION_NAME_CONFLICT_ERROR,
  } = props;
  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();
  if (!currentActionConfig?.id) {
    log.error(
      `No correct ${
        props.pluginType === PluginType.JS
          ? "JSObject Id"
          : "API id or Query id"
      } found in the url.`,
    );
  }
  const guidedTourEnabled = useSelector(inGuidedTour);

  const saveStatus: {
    isSaving: boolean;
    error: boolean;
  } = useSelector((state: AppState) =>
    props.pluginType === PluginType.JS
      ? getSavingStatusForJSObjectName(state, currentActionConfig?.id || "")
      : getSavingStatusForActionName(state, currentActionConfig?.id || ""),
  );

  const conflictingNames = useSelector(
    (state: AppState) =>
      getUsedActionNames(state, currentActionConfig?.id || ""),
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
      } else if (
        name !== currentActionConfig?.name &&
        hasActionNameConflict(name)
      ) {
        return createMessage(suffixErrorMessage, name);
      }
      return false;
    },
    [currentActionConfig, hasActionNameConflict],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      if (
        currentActionConfig &&
        name !== currentActionConfig.name &&
        !isInvalidNameForEntity(name)
      ) {
        if (checkForGuidedTour && guidedTourEnabled) {
          dispatch(toggleShowDeviationDialog(true));
          return;
        }

        dispatch(dispatchAction({ id: currentActionConfig.id, name }));
      }
    },
    [dispatch, isInvalidNameForEntity, currentActionConfig, guidedTourEnabled],
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
