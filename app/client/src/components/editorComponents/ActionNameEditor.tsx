import React, { memo } from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";
import type { AppState } from "@appsmith/reducers";

import { saveActionName } from "actions/pluginActionActions";
import { Spinner } from "design-system";
import { getAction, getPlugin } from "@appsmith/selectors/entitiesSelector";
import NameEditorComponent, {
  IconBox,
  IconWrapper,
  NameWrapper,
} from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";

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
  enableFontStyling?: boolean;
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
        <NameWrapper enableFontStyling={props.enableFontStyling}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {currentPlugin && (
              <IconBox>
                <IconWrapper
                  alt={currentPlugin.name}
                  src={getAssetUrl(currentPlugin?.iconLocation)}
                />
              </IconBox>
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
        </NameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default memo(ActionNameEditor);
