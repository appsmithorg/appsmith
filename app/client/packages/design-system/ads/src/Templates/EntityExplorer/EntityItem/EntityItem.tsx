import React, { useMemo } from "react";
import { ListItem, Tooltip } from "../../..";

import type { EntityItemProps } from "./EntityItem.types";
import { EntityEditableName } from "./EntityItem.styled";
import { useEditableText } from "../Editable";

export const EntityItem = (props: EntityItemProps) => {
  const { canEdit, isEditing, onEditComplete, onNameSave, validateName } =
    props.nameEditorConfig;

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

  const inputProps = useMemo(
    () => ({
      onChange: handleTitleChange,
      onKeyUp: handleKeyUp,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        height: "32px",
        top: 0,
      },
    }),
    [handleKeyUp, handleTitleChange],
  );

  const customTitle = useMemo(() => {
    return (
      <Tooltip
        content={validationError}
        placement="bottomLeft"
        showArrow={false}
        visible={Boolean(validationError)}
      >
        <EntityEditableName
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

  return <ListItem {...props} customTitleComponent={customTitle} />;
};
