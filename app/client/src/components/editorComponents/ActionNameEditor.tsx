import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { convertToCamelCase } from "utils/helpers";
import { AppState } from "reducers";
import { RestAction } from "entities/Action";
import { Page } from "constants/ReduxActionConstants";

import { saveActionName } from "actions/actionActions";
import { Spinner } from "@blueprintjs/core";

const ApiNameWrapper = styled.div`
  max-width: 50%;
  flex-grow: 1;
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
`;

export const ActionNameEditor = () => {
  const params = useParams<{ apiId?: string; queryId?: string }>();
  const isNew =
    new URLSearchParams(window.location.search).get("new") === "true";
  const [forceUpdate, setForceUpdate] = useState(false);
  const dispatch = useDispatch();
  if (!params.apiId && !params.queryId) {
    console.log("No API id or Query id found in the url.");
  }

  const actions: RestAction[] = useSelector((state: AppState) =>
    state.entities.actions.map(action => action.config),
  );

  const existingPageNames: string[] = useSelector((state: AppState) =>
    state.entities.pageList.pages.map((page: Page) => page.pageName),
  );

  const currentActionConfig: RestAction | undefined = actions.find(
    action => action.id === params.apiId || action.id === params.queryId,
  );

  const existingWidgetNames: string[] = useSelector((state: AppState) =>
    Object.values(state.entities.canvasWidgets).map(
      widget => widget.widgetName,
    ),
  );

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
    (name: string) =>
      !(
        existingPageNames.indexOf(name) === -1 &&
        actions.findIndex(action => action.name === name) === -1 &&
        existingWidgetNames.indexOf(name) === -1
      ),
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
          valueTransform={convertToCamelCase}
          isEditingDefault={isNew}
          updating={saveStatus.isSaving}
          editInteractionKind={EditInteractionKind.SINGLE}
        />
        {saveStatus.isSaving && <Spinner size={16} />}
      </div>
    </ApiNameWrapper>
  );
};

export default ActionNameEditor;
