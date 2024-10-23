import React, { useMemo } from "react";

import { FileTab, type FileTabProps } from "IDE/Components/FileTab";
import { useNameEditor } from "utils/hooks/useNameEditor";
import { type EntityItem } from "ee/entities/IDE/constants";
import { useCurrentEditorState } from "../hooks";

import { useSelector } from "react-redux";
import { useEventCallback } from "usehooks-ts";
import { getIsSavingEntityName } from "ee/selectors/entitiesSelector";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getEditableTabPermissions,
  saveEntityName,
} from "ee/entities/IDE/utils";

interface EditableTabProps extends Omit<FileTabProps, "isLoading" | "onClose"> {
  id: string;
  onClose: (id: string) => void;
  entity?: EntityItem;
}

export function EditableTab(props: EditableTabProps) {
  const { entity, icon, id, isActive, onClick, onClose, title } = props;
  const { segment } = useCurrentEditorState();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getEditableTabPermissions({
    isFeatureEnabled,
    entity,
  });

  const { handleNameSave, normalizeName, validateName } = useNameEditor({
    entityId: id,
    entityName: title,
    nameSaveAction: (params) => saveEntityName({ params, segment, entity }),
  });

  const isLoading = useSelector((state) =>
    getIsSavingEntityName(state, { id, segment, entity }),
  );

  const editorConfig = useMemo(
    () => ({
      onTitleSave: handleNameSave,
      validateTitle: validateName,
      titleTransformer: normalizeName,
    }),
    [handleNameSave, normalizeName, validateName],
  );

  const handleClose = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(id);
  });

  return (
    <FileTab
      editorConfig={editorConfig}
      icon={icon}
      isActive={isActive}
      isChangePermitted={isChangePermitted}
      isLoading={isLoading}
      onClick={onClick}
      onClose={handleClose}
      title={title}
    />
  );
}
