import React from "react";
import { noop } from "lodash";
import { useBoolean } from "usehooks-ts";

import { DismissibleTab } from "../../DismissibleTab";
import { EditableEntityName } from "../EditableEntityName";

import type { EditableDismissibleTabProps } from "./EditableDismissibleTab.types";

export const EditableDismissibleTab = (props: EditableDismissibleTabProps) => {
  const {
    canEdit,
    dataTestId,
    icon,
    isActive,
    isEditable = true,
    isEditing: propIsEditing,
    isLoading,
    name,
    onClick,
    onClose,
    onEnterEditMode: propOnEnterEditMode,
    onExitEditMode: propOnExitEditMode,
    onNameSave,
    validateName,
  } = props;

  const {
    setFalse: localOnExitEditMode,
    setTrue: localOnEnterEditMode,
    value: localIsEditing,
  } = useBoolean(false);

  const isEditing = propIsEditing ?? localIsEditing;
  const handleEnterEditMode = propOnEnterEditMode ?? localOnEnterEditMode;
  const handleExitEditMode = propOnExitEditMode ?? localOnExitEditMode;

  const handleDoubleClick = isEditable ? handleEnterEditMode : noop;

  return (
    <DismissibleTab
      dataTestId={dataTestId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
      onDoubleClick={handleDoubleClick}
    >
      <EditableEntityName
        canEdit={canEdit}
        icon={icon}
        isEditing={isEditing}
        isLoading={isLoading}
        name={name}
        onExitEditing={handleExitEditMode}
        onNameSave={onNameSave}
        validateName={validateName}
      />
    </DismissibleTab>
  );
};
