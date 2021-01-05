import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import { removeSpecialChars, isNameValid } from "utils/helpers";
import { AppState } from "reducers";
import { RestAction } from "entities/Action";
import { Page } from "constants/ReduxActionConstants";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getExistingPageNames } from "sagas/selectors";

import { saveActionName } from "actions/actionActions";
import EditableText, {
  EditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { Classes } from "@blueprintjs/core";

const ApiNameWrapper = styled.div`
  min-width: 50%;
  margin-right: 10px;
  display: flex;
  justify-content: flex-start;
  align-content: center;
  & > div {
    max-width: 100%;
    flex: 0 1 auto;
    font-size: ${props => props.theme.fontSizes[5]}px;
    font-weight: ${props => props.theme.fontWeights[2]};
  }

  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    font-size: ${props => props.theme.typography.h3.fontSize}px;
    line-height: ${props => props.theme.typography.h3.lineHeight}px !important;
    letter-spacing: ${props => props.theme.typography.h3.letterSpacing}px;
    font-weight: ${props => props.theme.typography.h3.fontWeight};
  }
`;

export const ActionNameEditor = () => {
  const params = useParams<{ apiId?: string; queryId?: string }>();
  const isNew =
    new URLSearchParams(window.location.search).get("editName") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();
  if (!params.apiId && !params.queryId) {
    console.log("No API id or Query id found in the url.");
  }

  const actions: RestAction[] = useSelector((state: AppState) =>
    state.entities.actions.map(action => action.config),
  );

  const currentActionConfig: RestAction | undefined = actions.find(
    action => action.id === params.apiId || action.id === params.queryId,
  );

  const existingWidgetNames: string[] = useSelector((state: AppState) =>
    Object.values(state.entities.canvasWidgets).map(
      widget => widget.widgetName,
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
    }
  }, [saveStatus.isSaving, saveStatus.error]);

  return (
    <ApiNameWrapper>
      <EditableText
        className="t--action-name-edit-field"
        defaultValue={currentActionConfig ? currentActionConfig.name : ""}
        placeholder="Name of the API in camelCase"
        forceDefault={forceUpdate}
        onBlur={handleAPINameChange}
        isInvalid={isInvalidActionName}
        valueTransform={removeSpecialChars}
        isEditingDefault={isNew}
        savingState={
          saveStatus.isSaving ? SavingState.STARTED : SavingState.NOT_STARTED
        }
        editInteractionKind={EditInteractionKind.SINGLE}
        hideEditIcon={true}
      />
    </ApiNameWrapper>
  );
};

export default ActionNameEditor;
