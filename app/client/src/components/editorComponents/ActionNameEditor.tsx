import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars, isNameValid } from "utils/helpers";
import { AppState } from "reducers";
import { Action } from "entities/Action";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getExistingPageNames } from "sagas/selectors";

import { saveActionName } from "actions/actionActions";
import { Spinner } from "@blueprintjs/core";
import { checkCurrentStep } from "sagas/OnboardingSagas";
import {
  EditableText as NewEditableText,
  EditInteractionKind as NewEditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { Classes } from "@blueprintjs/core";
import { OnboardingStep } from "constants/OnboardingConstants";
import log from "loglevel";

const ApiNameWrapper = styled.div<{ page?: string }>`
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
    props.page === "API_PANE"
      ? `  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    font-size: ${props.theme.typography.h3.fontSize}px;
    line-height: ${props.theme.typography.h3.lineHeight}px !important;
    letter-spacing: ${props.theme.typography.h3.letterSpacing}px;
    font-weight: ${props.theme.typography.h3.fontWeight};
  }`
      : null}
`;

type ActionNameEditorProps = {
  /*
    This prop checks if page is API Pane or Query Pane or Curl Pane
    So, that we can toggle between ads editable-text component and existing editable-text component
    Right now, it's optional so that it doesn't impact any other pages other than API Pane.
    In future, when default component will be ads editable-text, then we can remove this prop.
  */
  page?: string;
};

export const ActionNameEditor = (props: ActionNameEditorProps) => {
  const params = useParams<{ apiId?: string; queryId?: string }>();
  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();
  if (!params.apiId && !params.queryId) {
    log.error("No API id or Query id found in the url.");
  }

  // For onboarding
  const hideEditIcon = useSelector((state: AppState) =>
    checkCurrentStep(state, OnboardingStep.SUCCESSFUL_BINDING, "LESSER"),
  );

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );

  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );

  const existingWidgetNames: string[] = useSelector((state: AppState) =>
    Object.values(state.entities.canvasWidgets).map(
      (widget) => widget.widgetName,
    ),
  );

  const evalTree = useSelector(getDataTree);
  const existingPageNames = useSelector(getExistingPageNames);

  const saveStatus: {
    isSaving: boolean;
    error: boolean;
  } = useSelector((state: AppState) => {
    const id = currentActionConfig ? currentActionConfig.id : "";
    return {
      isSaving: state.ui.apiName.isSaving[id],
      error: state.ui.apiName.errors[id],
    };
  });

  const hasActionNameConflict = useCallback(
    (name: string) => !isNameValid(name, { ...existingPageNames, ...evalTree }),
    [existingPageNames, actions, existingWidgetNames],
  );

  const isInvalidActionName = useCallback(
    (name: string): string | boolean => {
      if (!name || name.trim().length === 0) {
        return "Please enter a valid name";
      } else if (
        name !== currentActionConfig?.name &&
        hasActionNameConflict(name)
      ) {
        return `${name} is already being used.`;
      }
      return false;
    },
    [currentActionConfig, hasActionNameConflict],
  );

  const handleAPINameChange = useCallback(
    (name: string) => {
      if (
        currentActionConfig &&
        name !== currentActionConfig?.name &&
        !isInvalidActionName(name)
      ) {
        dispatch(saveActionName({ id: currentActionConfig.id, name }));
      }
    },
    [dispatch, isInvalidActionName, currentActionConfig],
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

  return (
    <ApiNameWrapper page={props.page}>
      {props.page === "API_PANE" ? (
        <NewEditableText
          className="t--action-name-edit-field"
          defaultValue={currentActionConfig ? currentActionConfig.name : ""}
          placeholder="Name of the API in camelCase"
          forceDefault={forceUpdate}
          onBlur={handleAPINameChange}
          isInvalid={isInvalidActionName}
          valueTransform={removeSpecialChars}
          isEditingDefault={isNew && !hideEditIcon}
          savingState={
            saveStatus.isSaving ? SavingState.STARTED : SavingState.NOT_STARTED
          }
          editInteractionKind={NewEditInteractionKind.SINGLE}
          hideEditIcon
          underline
          fill
        />
      ) : (
        <div
          style={{
            display: "flex",
          }}
        >
          <EditableText
            className="t--action-name-edit-field"
            type="text"
            defaultValue={currentActionConfig ? currentActionConfig.name : ""}
            placeholder="Name of the API in camelCase"
            forceDefault={forceUpdate}
            onTextChanged={handleAPINameChange}
            isInvalid={isInvalidActionName}
            valueTransform={removeSpecialChars}
            isEditingDefault={isNew}
            updating={saveStatus.isSaving}
            editInteractionKind={EditInteractionKind.SINGLE}
          />
          {saveStatus.isSaving && <Spinner size={16} />}
        </div>
      )}
    </ApiNameWrapper>
  );
};

export default ActionNameEditor;
