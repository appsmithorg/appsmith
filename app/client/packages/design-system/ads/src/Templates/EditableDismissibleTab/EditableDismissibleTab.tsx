import React from "react";
import { noop } from "lodash";
import { useBoolean } from "usehooks-ts";

import { DismissibleTab } from "../..";
import { EditableEntityName } from "..";

import type { EditableDismissibleTabProps } from "./EditableDismissibleTab.types";

export const EditableDismissibleTab = (props: EditableDismissibleTabProps) => {
  const {
    canEdit,
    dataTestId,
    icon,
    isActive,
    isEditable = true,
    isLoading,
    name,
    onClick,
    onClose,
    onNameSave,
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
        canEdit={canEdit}
        icon={icon}
        isEditing={isEditing}
        isLoading={isLoading}
        name={name}
        onExitEditing={exitEditMode}
        onNameSave={onNameSave}
        validateName={validateName}
      />
    </DismissibleTab>
  );
};
