import React, { memo } from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import styled from "styled-components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";

import { saveActionName } from "actions/pluginActionActions";
import { Spinner } from "design-system";
import { Classes } from "@blueprintjs/core";
import { getAction, getPlugin } from "@appsmith/selectors/entitiesSelector";
import NameEditorComponent from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";

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
    letter-spacing: ${props.theme.typography.h3.letterSpacing}px;
    font-weight: ${props.theme.typography.h3.fontWeight};
  }`
      : null}
`;

const ApiIconWrapper = styled.img`
  width: 34px;
  height: auto;
`;
const ApiIconBox = styled.div`
  height: 34px;
  width: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
`;

interface SaveActionNameParams {
  id: string;
  name: string;
}
interface ActionNameEditorProps {
  /*
    This prop checks if page is API Pane or Query Pane or Curl Pane
    So, that we can toggle between ads editable-text component and existing editable-text component
    Right now, it's optional so that it doesn't impact any other pages other than API Pane.
    In future, when default component will be ads editable-text, then we can remove this prop.
  */
  page?: string;
  disabled?: boolean;
  saveActionName?: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

function ActionNameEditor(props: ActionNameEditorProps) {
  const params = useParams<{ apiId?: string; queryId?: string }>();

  const currentActionConfig = useSelector((state: AppState) =>
    getAction(state, params.apiId || params.queryId || ""),
  );

  const currentPlugin = useSelector((state: AppState) =>
    getPlugin(state, currentActionConfig?.pluginId || ""),
  );

  const saveStatus = useSelector((state) =>
    getSavingStatusForActionName(state, currentActionConfig?.id || ""),
  );

  return (
    <NameEditorComponent
      checkForGuidedTour
      /**
       * This component is used by module editor in EE which uses a different
       * action to save the name of an action. The current callers of this component
       * pass the existing saveAction action but as fallback the saveActionName is used here
       * as a guard.
       */
      dispatchAction={props.saveActionName || saveActionName}
      id={currentActionConfig?.id}
      idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
      name={currentActionConfig?.name}
      saveStatus={saveStatus}
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
              alignItems: "center",
            }}
          >
            {currentPlugin && (
              <ApiIconBox>
                <ApiIconWrapper
                  alt={currentPlugin.name}
                  src={getAssetUrl(currentPlugin?.iconLocation)}
                />
              </ApiIconBox>
            )}
            <EditableText
              className="t--action-name-edit-field"
              defaultValue={currentActionConfig ? currentActionConfig.name : ""}
              disabled={props.disabled}
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
            {saveStatus.isSaving && <Spinner size="md" />}
          </div>
        </ApiNameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default memo(ActionNameEditor);
