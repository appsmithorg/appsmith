import React, { useMemo } from "react";

import { FileTab, type FileTabProps } from "IDE/Components/FileTab";
import { useNameEditor } from "utils/hooks/useNameEditor";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import { saveActionName } from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";
import { useCurrentEditorState } from "../hooks";

import {
  getIsSavingForApiName,
  getIsSavingForJSObjectName,
} from "selectors/ui";
import { useSelector } from "react-redux";
import { useEventCallback } from "usehooks-ts";

interface EditableTabProps extends Omit<FileTabProps, "isLoading" | "onClose"> {
  id: string;
  onClose: (id: string) => void;
}

export function EditableTab(props: EditableTabProps) {
  const { icon, id, isActive, onClick, onClose, title } = props;
  const { segment } = useCurrentEditorState();

  const { handleNameSave, normalizeName, validateName } = useNameEditor({
    entityId: id,
    entityName: title,
    nameSaveAction:
      EditorEntityTab.JS === segment ? saveJSObjectName : saveActionName,
  });

  const isLoading = useSelector((state) =>
    EditorEntityTab.JS === segment
      ? getIsSavingForJSObjectName(state, id)
      : getIsSavingForApiName(state, id),
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
      isLoading={isLoading}
      onClick={onClick}
      onClose={handleClose}
      title={title}
    />
  );
}
