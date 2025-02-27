import React, { useMemo } from "react";
import { ListItem } from "../../../List";
import type { EntityItemProps } from "./EntityItem.types";
import clx from "classnames";
import { EditableEntityName } from "../../EditableEntityName";
import { useActiveDoubleClick } from "../../../__hooks__";

export const EntityItem = (props: EntityItemProps) => {
  const { onDoubleClick, startIcon, ...rest } = props;

  const doubleClickOverride = useActiveDoubleClick(
    props.isSelected || false,
    onDoubleClick,
  );

  const {
    canEdit,
    isEditing,
    isLoading,
    normalizeName = false,
    onEditComplete,
    onNameSave,
    validateName,
  } = props.nameEditorConfig;

  const inEditMode = canEdit ? isEditing : false;

  // Use List Item custom title prop to show the editable name
  const customTitle = useMemo(() => {
    return (
      <EditableEntityName
        canEdit={canEdit}
        icon={startIcon}
        isEditing={isEditing}
        isFixedWidth
        isLoading={isLoading}
        name={props.title}
        normalizeName={normalizeName}
        onExitEditing={onEditComplete}
        onNameSave={onNameSave}
        size="medium"
        validateName={validateName}
      />
    );
  }, [
    canEdit,
    isEditing,
    isLoading,
    onEditComplete,
    onNameSave,
    props.title,
    startIcon,
    validateName,
  ]);

  // Do not show right control if the visibility is hover and the item is in edit mode
  const rightControl = useMemo(() => {
    if (props.rightControlVisibility === "hover" && inEditMode) {
      return null;
    }

    return props.rightControl;
  }, [inEditMode, props.rightControl, props.rightControlVisibility]);

  return (
    <ListItem
      {...rest}
      className={clx("t--entity-item", props.className)}
      customTitleComponent={customTitle}
      dataTestId={`t--entity-item-${props.title}`}
      id={"entity-" + props.id}
      onDoubleClick={doubleClickOverride}
      rightControl={rightControl}
    />
  );
};
