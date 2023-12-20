import React, { memo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { removeSpecialChars } from "utils/helpers";

import { Icon, Spinner } from "design-system";
import NameEditorComponent, {
  IconBox,
  NameWrapper,
} from "components/utils/NameEditorComponent";
import {
  ACTION_ID_NOT_FOUND_IN_URL,
  ACTION_NAME_PLACEHOLDER,
  createMessage,
} from "@appsmith/constants/messages";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { getIsModuleInstanceNameSavingStatus } from "@appsmith/selectors/moduleInstanceSelectors";
import { saveModuleInstanceName } from "@appsmith/actions/moduleInstanceActions";

interface ModuleInstanceNameEditorProps {
  disabled?: boolean;
  moduleInstance: ModuleInstance;
}

const StyledIcon = styled(Icon)`
  & svg {
    width: 34px;
    height: 34px;
  }
`;

function ModuleInstanceNameEditor({
  disabled,
  moduleInstance,
}: ModuleInstanceNameEditorProps) {
  const saveStatus = useSelector((state) =>
    getIsModuleInstanceNameSavingStatus(state, moduleInstance.id),
  );

  return (
    <NameEditorComponent
      checkForGuidedTour
      dispatchAction={saveModuleInstanceName}
      id={moduleInstance.id}
      idUndefinedErrorMessage={ACTION_ID_NOT_FOUND_IN_URL}
      name={moduleInstance.name}
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
        <NameWrapper enableFontStyling>
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconBox>
              <StyledIcon name="module" size="lg" />
            </IconBox>
            <EditableText
              className="t--module-instance-name-edit-field"
              defaultValue={moduleInstance.name || ""}
              disabled={disabled}
              editInteractionKind={EditInteractionKind.SINGLE}
              errorTooltipClass="t--module-instance-name-edit-error"
              forceDefault={forceUpdate}
              isEditingDefault={isNew}
              isInvalid={isInvalidNameForEntity}
              onTextChanged={handleNameChange}
              placeholder={createMessage(
                ACTION_NAME_PLACEHOLDER,
                "Module Instance",
              )}
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

export default memo(ModuleInstanceNameEditor);
