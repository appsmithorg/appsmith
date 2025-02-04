import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEventCallback } from "usehooks-ts";

import { EditableDismissibleTab } from "@appsmith/ads";

import { type EntityItem } from "ee/entities/IDE/constants";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getIsSavingEntityName } from "ee/selectors/entitiesSelector";

import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { sanitizeString } from "utils/URLUtils";

import {
  getEditableTabPermissions,
  saveEntityName,
} from "ee/entities/IDE/utils";
import { useIsRenaming, useValidateEntityName } from "IDE";

import { useCurrentEditorState } from "../hooks";

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
  const dispatch = useDispatch();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getEditableTabPermissions({
    isFeatureEnabled,
    entity,
  });

  const { enterEditMode, exitEditMode, isEditing } = useIsRenaming(id);

  const isLoading = useSelector((state) =>
    getIsSavingEntityName(state, { id, segment, entity }),
  );

  const validateName = useValidateEntityName({
    entityName: title,
  });

  const handleClose = useEventCallback(() => {
    onClose(id);
  });

  const handleNameSave = useCallback(
    (name: string) => {
      dispatch(saveEntityName({ params: { id, name }, segment, entity }));
    },
    [dispatch, entity, id, segment],
  );

  return (
    <EditableDismissibleTab
      canEdit={isChangePermitted}
      dataTestId={`t--ide-tab-${sanitizeString(title)}`}
      icon={icon}
      isActive={isActive}
      isEditable={isChangePermitted}
      isEditing={isEditing}
      isLoading={isLoading}
      name={title}
      onClick={onClick}
      onClose={handleClose}
      onEnterEditMode={enterEditMode}
      onExitEditMode={exitEditMode}
      onNameSave={handleNameSave}
      validateName={validateName}
    />
  );
}
