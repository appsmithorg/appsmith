import React, { memo } from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";
import { AppState } from "reducers";
import { Action } from "entities/Action";

import { saveActionName } from "actions/pluginActionActions";
import { Spinner } from "@blueprintjs/core";
import { Classes } from "@blueprintjs/core";
import { getAction, getPlugin } from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";

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

const ApiIconWrapper = styled.img`
  width: 24px;
  height: 24px;
  margin-right: 8px;
  align-self: center;
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

function ActionNameEditor(props: ActionNameEditorProps) {
  const params = useParams<{ apiId?: string; queryId?: string }>();

  const currentActionConfig:
    | Action
    | undefined = useSelector((state: AppState) =>
    getAction(state, params.apiId || params.queryId || ""),
  );

  const currentPlugin: Plugin | undefined = useSelector((state: AppState) =>
    getPlugin(state, currentActionConfig?.pluginId || ""),
  );

  return (
    <NameEditorComponent
      checkForGuidedTour
      currentActionConfig={currentActionConfig}
      dispatchAction={saveActionName}
    >
      {({
        forceUpdate,
        handleNameChange,
        isInvalidNameForEntity,
        isNew,
        saveStatus,
      }: {
        forceUpdate: boolean;
        handleNameChange: (value: string) => void;
        isInvalidNameForEntity: (value: string) => string | boolean;
        isNew: boolean;
        saveStatus: { isSaving: boolean; error: boolean };
      }) => (
        <ApiNameWrapper page={props.page}>
          <div
            style={{
              display: "flex",
            }}
          >
            {currentPlugin && (
              <ApiIconWrapper
                alt={currentPlugin.name}
                src={currentPlugin.iconLocation}
              />
            )}
            <EditableText
              className="t--action-name-edit-field"
              defaultValue={currentActionConfig ? currentActionConfig.name : ""}
              editInteractionKind={EditInteractionKind.SINGLE}
              errorTooltipClass="t--action-name-edit-error"
              forceDefault={forceUpdate}
              isEditingDefault={isNew}
              isInvalid={isInvalidNameForEntity}
              onTextChanged={handleNameChange}
              placeholder={createMessage(ACTION_NAME_PLACEHOLDER, "Api")}
              type="text"
              underline
              updating={saveStatus.isSaving}
              valueTransform={removeSpecialChars}
            />
            {saveStatus.isSaving && <Spinner size={16} />}
          </div>
        </ApiNameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default memo(ActionNameEditor);
