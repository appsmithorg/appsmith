import React from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  EditableText as NewEditableText,
  EditInteractionKind as NewEditInteractionKind,
  SavingState,
} from "components/ads/EditableText";
import { removeSpecialChars } from "utils/helpers";
import { AppState } from "reducers";
import { JSCollection } from "entities/JSCollection";
import { Classes } from "@blueprintjs/core";
import { saveJSObjectName } from "actions/jsActionActions";
import { getJSCollection } from "selectors/entitiesSelector";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";

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

export function JSObjectNameEditor(props: ActionNameEditorProps) {
  const params = useParams<{ collectionId?: string; queryId?: string }>();

  const currentJSObjectConfig:
    | JSCollection
    | undefined = useSelector((state: AppState) =>
    getJSCollection(state, params.collectionId || ""),
  );

  return (
    <NameEditorComponent
      currentActionConfig={currentJSObjectConfig}
      dispatchAction={saveJSObjectName}
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
          <NewEditableText
            className="t--js-action-name-edit-field"
            defaultValue={
              currentJSObjectConfig ? currentJSObjectConfig.name : ""
            }
            editInteractionKind={NewEditInteractionKind.SINGLE}
            fill
            forceDefault={forceUpdate}
            hideEditIcon
            isEditingDefault={isNew}
            isInvalid={isInvalidNameForEntity}
            onBlur={handleNameChange}
            placeholder={createMessage(ACTION_NAME_PLACEHOLDER, "object")}
            savingState={
              saveStatus.isSaving
                ? SavingState.STARTED
                : SavingState.NOT_STARTED
            }
            underline
            valueTransform={removeSpecialChars}
          />
        </JSObjectNameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default JSObjectNameEditor;
