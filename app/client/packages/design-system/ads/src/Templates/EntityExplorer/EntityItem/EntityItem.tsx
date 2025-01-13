import React, { useMemo } from "react";
import { ListItem } from "../../../List";
import { Spinner } from "../../../Spinner";
import { Tooltip } from "../../../Tooltip";

import type { EntityItemProps } from "./EntityItem.types";
import { EntityEditableName } from "./EntityItem.styles";
import { useEditableText } from "../Editable";
import clx from "classnames";

export const EntityItem = (props: EntityItemProps) => {
  const {
    canEdit,
    isEditing,
    isLoading,
    onEditComplete,
    onNameSave,
    validateName,
  } = props.nameEditorConfig;

  const inEditMode = canEdit ? isEditing : false;

  const [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ] = useEditableText(
    inEditMode,
    props.title,
    onEditComplete,
    validateName,
    onNameSave,
  );

  // When in loading state, start icon becomes the loading icon
  const startIcon = useMemo(() => {
    if (isLoading) {
      return <Spinner size="md" />;
    }

    return props.startIcon;
  }, [isLoading, props.startIcon]);

  const inputProps = useMemo(
    () => ({
      onChange: handleTitleChange,
      onKeyUp: handleKeyUp,
    }),
    [handleKeyUp, handleTitleChange],
  );

  // Use List Item custom title prop to show the editable name
  const customTitle = useMemo(() => {
    return (
      <Tooltip
        content={validationError}
        placement="bottomLeft"
        showArrow={false}
        visible={Boolean(validationError)}
      >
        <EntityEditableName
          data-isediting={inEditMode}
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={inEditMode}
          kind="body-m"
        >
          {editableName}
        </EntityEditableName>
      </Tooltip>
    );
  }, [editableName, inputProps, inputRef, inEditMode, validationError]);

  // Do not show right control if the visibility is hover and the item is in edit mode
  const rightControl = useMemo(() => {
    if (props.rightControlVisibility === "hover" && inEditMode) {
      return null;
    }

    return props.rightControl;
  }, [inEditMode, props.rightControl, props.rightControlVisibility]);

  return (
    <ListItem
      {...props}
      className={clx("t--entity-item", props.className)}
      customTitleComponent={customTitle}
      data-testid={`t--entity-item-${props.title}`}
      id={"entity-" + props.id}
      rightControl={rightControl}
      startIcon={startIcon}
    />
  );
};
