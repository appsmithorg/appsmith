import React, { memo } from "react";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";

import { Flex } from "@appsmith/ads";
import NameEditorComponent, {
  IconBox,
  NameWrapper,
} from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "ee/constants/messages";
import type { ReduxAction } from "constants/ReduxActionTypes";
import type { SaveActionNameParams } from "PluginActionEditor";
import type { Action } from "entities/Action";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";

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
  actionConfig?: Action | ModuleInstance;
  icon?: JSX.Element;
  saveStatus: { isSaving: boolean; error: boolean };
}

function ActionNameEditor(props: ActionNameEditorProps) {
  const {
    actionConfig,
    disabled = false,
    enableFontStyling = false,
    icon = "",
    saveActionName,
    saveStatus,
  } = props;

  return (
    <NameEditorComponent
      id={actionConfig?.id}
      idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
      name={actionConfig?.name}
      onSaveName={saveActionName}
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
        <NameWrapper enableFontStyling={enableFontStyling}>
          <Flex
            alignItems="center"
            gap="spaces-3"
            overflow="hidden"
            width="100%"
          >
            {icon && <IconBox className="t--plugin-icon-box">{icon}</IconBox>}
            <EditableText
              className="t--action-name-edit-field"
              defaultValue={actionConfig ? actionConfig.name : ""}
              disabled={disabled}
              editInteractionKind={EditInteractionKind.SINGLE}
              errorTooltipClass="t--action-name-edit-error"
              forceDefault={forceUpdate}
              iconSize={"md"}
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
