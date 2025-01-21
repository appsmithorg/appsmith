import React from "react";
import { noop } from "lodash";
import { useBoolean } from "usehooks-ts";

import { DismissibleTab, EditableEntityName } from "@appsmith/ads";

interface EditableDismissibleTabProps {
  dataTestId?: string;
  icon: React.ReactNode;
  isActive: boolean;
  isEditable?: boolean;
  isLoading: boolean;
  name: string;
  onClick: () => void;
  onClose: () => void;
  onDoubleClick: () => void;
  onExitEditing: () => void;
  onNameSave: (name: string) => void;
  validateName: (name: string) => string | null;
}

export const EditableDismissibleTab = (props: EditableDismissibleTabProps) => {
  const {
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
