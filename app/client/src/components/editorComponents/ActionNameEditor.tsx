import React, { memo } from "react";
import { useSelector } from "react-redux";

import { useParams } from "react-router-dom";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";
import type { AppState } from "ee/reducers";

import { Flex } from "@appsmith/ads";
import { getActionByBaseId, getPlugin } from "ee/selectors/entitiesSelector";
import NameEditorComponent, {
  IconBox,
  NameWrapper,
} from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "ee/constants/messages";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import type { SaveActionNameParams } from "PluginActionEditor";
import {
  ActionUrlIcon,
  DefaultModuleIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

interface ActionNameEditorProps {
  /*
    This prop checks if page is API Pane or Query Pane or Curl Pane
    So, that we can toggle between ads editable-text component and existing editable-text component
    Right now, it's optional so that it doesn't impact any other pages other than API Pane.
    In future, when default component will be ads editable-text, then we can remove this prop.
  */
  enableFontStyling?: boolean;
  disabled?: boolean;
  saveActionName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

function ActionNameEditor(props: ActionNameEditorProps) {
  const params = useParams<{
    baseApiId?: string;
    baseQueryId?: string;
    moduleInstanceId?: string;
  }>();

  const currentActionConfig = useSelector((state: AppState) =>
    getActionByBaseId(state, params.baseApiId || params.baseQueryId || ""),
  );

  const currentPlugin = useSelector((state: AppState) =>
    getPlugin(state, currentActionConfig?.pluginId || ""),
  );

  const saveStatus = useSelector((state) =>
    getSavingStatusForActionName(state, currentActionConfig?.id || ""),
  );

  const iconUrl = getAssetUrl(currentPlugin?.iconLocation) || "";

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  return (
    <NameEditorComponent
      id={currentActionConfig?.id}
      idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
      name={currentActionConfig?.name}
      onSaveName={props.saveActionName}
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
          <Flex
            alignItems="center"
            gap="spaces-3"
            overflow="hidden"
            width="100%"
          >
            {currentPlugin && (
              <IconBox className="t--plugin-icon-box">
                {iconUrl ? ActionUrlIcon(iconUrl) : DefaultModuleIcon()}
              </IconBox>
            )}
            <EditableText
              className="t--action-name-edit-field"
              defaultValue={currentActionConfig ? currentActionConfig.name : ""}
              disabled={props.disabled}
              editInteractionKind={EditInteractionKind.SINGLE}
              errorTooltipClass="t--action-name-edit-error"
              forceDefault={forceUpdate}
              iconSize={isActionRedesignEnabled ? "sm" : "md"}
              isEditingDefault={isNew}
              isInvalid={isInvalidNameForEntity}
              onTextChanged={handleNameChange}
              placeholder={createMessage(ACTION_NAME_PLACEHOLDER, "Api")}
              type="text"
              underline
              updating={saveStatus.isSaving}
              valueTransform={removeSpecialChars}
            />
          </Flex>
        </NameWrapper>
      )}
    </NameEditorComponent>
  );
}

export default memo(ActionNameEditor);
