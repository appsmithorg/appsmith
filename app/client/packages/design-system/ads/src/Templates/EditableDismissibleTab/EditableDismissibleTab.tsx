import React from "react";
import { noop } from "lodash";
import { useBoolean } from "usehooks-ts";

import { DismissibleTab } from "../..";
import { EditableEntityName } from "..";

import type { EditableDismissibleTabProps } from "./EditableDismissibleTab.types";

export const EditableDismissibleTab = (props: EditableDismissibleTabProps) => {
  const {
    dataTestId,
    isActive,
    isEditable = true,
    isLoading,
    name,
    onClick,
    onClose,
    onNameSave,
    startIcon,
    validateName,
  } = props;

  const {
    setFalse: exitEditMode,
    setTrue: enterEditMode,
    value: isEditing,
  } = useBoolean(false);

  const handleDoubleClick = isEditable ? enterEditMode : noop;

  return (
    <DismissibleTab
      dataTestId={dataTestId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
      onDoubleClick={handleDoubleClick}
    >
      <EditableEntityName
        isEditing={isEditing}
        isLoading={isLoading}
        name={name}
        onEditComplete={exitEditMode}
        onNameSave={onNameSave}
        startIcon={startIcon}
        validateName={validateName}
      />
    </DismissibleTab>
  );
};
