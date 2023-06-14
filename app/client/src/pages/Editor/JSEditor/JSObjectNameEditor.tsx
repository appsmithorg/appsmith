import React from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import { removeSpecialChars } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";
import type { JSCollection } from "entities/JSCollection";
import { Classes } from "@blueprintjs/core";
import { saveJSObjectName } from "actions/jsActionActions";
import { getJSCollection, getPlugin } from "selectors/entitiesSelector";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";
import { PluginType } from "entities/Action";
import type { Plugin } from "api/PluginApi";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { Spinner } from "design-system";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const JSObjectNameWrapper = styled.div<{ page?: string }>`
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
    props.page === "JS_PANE"
      ? `  &&& .${Classes.EDITABLE_TEXT_CONTENT}, &&& .${Classes.EDITABLE_TEXT_INPUT} {
    font-size: ${props.theme.typography.h3.fontSize}px;
    letter-spacing: ${props.theme.typography.h3.letterSpacing}px;
    font-weight: ${props.theme.typography.h3.fontWeight};
  }`
      : null}
`;

type JSObjectNameEditorProps = {
  /*
    This prop checks if page is API Pane or Query Pane or Curl Pane
    So, that we can toggle between ads editable-text component and existing editable-text component
    Right now, it's optional so that it doesn't impact any other pages other than API Pane.
    In future, when default component will be ads editable-text, then we can remove this prop.
  */
  page?: string;
  disabled?: boolean;
};

const IconContainer = styled.div`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
`;

const JSIcon = styled.img`
  width: 34px;
  height: auto;
`;

export function JSObjectNameEditor(props: JSObjectNameEditorProps) {
  const params = useParams<{ collectionId?: string; queryId?: string }>();

  const currentJSObjectConfig: JSCollection | undefined = useSelector(
    (state: AppState) => getJSCollection(state, params.collectionId || ""),
  );

  const currentPlugin: Plugin | undefined = useSelector((state: AppState) =>
    getPlugin(state, currentJSObjectConfig?.pluginId || ""),
  );

  return (
    <NameEditorComponent
      currentActionConfig={currentJSObjectConfig}
      dispatchAction={saveJSObjectName}
      pluginType={PluginType.JS}
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
        <JSObjectNameWrapper page={props.page}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {currentPlugin && (
              <IconContainer>
                <JSIcon
                  alt={currentPlugin.name}
                  src={getAssetUrl(currentPlugin.iconLocation)}
                />
              </IconContainer>
            )}
            <EditableText
              className="t--js-action-name-edit-field"
              defaultValue={
                currentJSObjectConfig ? currentJSObjectConfig.name : ""
              }
              disabled={props.disabled}
              editInteractionKind={EditInteractionKind.SINGLE}
              errorTooltipClass="t--action-name-edit-error"
              forceDefault={forceUpdate}
              isEditingDefault={isNew}
              isInvalid={isInvalidNameForEntity}
              onTextChanged={handleNameChange}
              placeholder={createMessage(ACTION_NAME_PLACEHOLDER, "JS Object")}
              type="text"
              underline
              updating={saveStatus.isSaving}
              valueTransform={removeSpecialChars}
            />
            {saveStatus.isSaving && <Spinner size="md" />}
          </div>
        </JSObjectNameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default JSObjectNameEditor;
