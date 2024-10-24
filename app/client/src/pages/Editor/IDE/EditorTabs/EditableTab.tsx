import React, { useCallback } from "react";

import { FileTab } from "IDE/Components/FileTab";
import { type EntityItem } from "ee/entities/IDE/constants";
import { useCurrentEditorState } from "../hooks";

import { useSelector } from "react-redux";
import { useBoolean, useEventCallback } from "usehooks-ts";
import { getIsSavingEntityName } from "ee/selectors/entitiesSelector";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getEditableTabPermissions,
  saveEntityName,
} from "ee/entities/IDE/utils";
import { noop } from "lodash";
import { EditableName } from "IDE";
import { IconContainer } from "IDE/Components/FileTab/styles";

interface EditableTabProps {
  id: string;
  onClick: () => void;
  onClose: (id: string) => void;
  entity?: EntityItem;
  icon?: React.ReactNode;
  isActive: boolean;
  title: string;
}

export function EditableTab(props: EditableTabProps) {
  const { entity, icon, id, isActive, onClick, onClose, title } = props;
  const { segment } = useCurrentEditorState();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getEditableTabPermissions({
    isFeatureEnabled,
    entity,
  });

  const {
    setFalse: exitEditMode,
    setTrue: enterEditMode,
    value: isEditing,
  } = useBoolean(false);

  const isLoading = useSelector((state) =>
    getIsSavingEntityName(state, { id, segment, entity }),
  );

  const handleClose = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(id);
  });

  const handleDoubleClick = isChangePermitted ? enterEditMode : noop;

  const handleNameSave = useCallback(
    (name: string) => {
      saveEntityName({ params: { id, name }, segment, entity });
      exitEditMode();
    },
    [entity, exitEditMode, id, segment],
  );

  return (
    <FileTab
      isActive={isActive}
      onClick={onClick}
      onClose={handleClose}
      onDoubleClick={handleDoubleClick}
      title={title}
    >
      <EditableName
        exitEditing={exitEditMode}
        icon={<IconContainer>{icon}</IconContainer>}
        isEditing={isEditing}
        isLoading={isLoading}
        name={title}
        onNameSave={handleNameSave}
      />
    </FileTab>
  );
}
