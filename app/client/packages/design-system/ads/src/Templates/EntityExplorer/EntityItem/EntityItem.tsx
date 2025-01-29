import React, { useMemo } from "react";
import { ListItem } from "../../../List";
import type { EntityItemProps } from "./EntityItem.types";
import clx from "classnames";
import { EditableEntityName } from "../../EditableEntityName";

export const EntityItem = (props: EntityItemProps) => {
  const {
    canEdit,
    isEditing,
    isLoading,
    onEditComplete,
    onNameSave,
    validateName,
  } = props.nameEditorConfig;

  const { startIcon, ...rest } = props;

  const inEditMode = canEdit ? isEditing : false;

  // Use List Item custom title prop to show the editable name
  const customTitle = useMemo(() => {
    return (
      <EditableEntityName
        canEdit={canEdit}
        gap="var(--ads-v2-spaces-3)"
        isEditing={isEditing}
        isFixedWidth
        isLoading={isLoading}
        name={props.title}
        onEditComplete={onEditComplete}
        onNameSave={onNameSave}
        startIcon={startIcon}
        textKind="body-m"
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
      data-testid={`t--entity-item-${props.title}`}
      id={"entity-" + props.id}
      rightControl={rightControl}
    />
  );
};
