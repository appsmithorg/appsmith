import React, { useEffect, useMemo, useRef, useState } from "react";

import { Spinner } from "../../Spinner";
import { Tooltip } from "../../Tooltip";
import { useEditableText } from "../../__hooks__";

import * as Styled from "./EditableEntityName.styles";

import type { EditableEntityNameProps } from "./EditableEntityName.types";
import clsx from "clsx";

export const isEllipsisActive = (element: HTMLElement | null) => {
  return element && element.clientWidth < element.scrollWidth;
};

export const EditableEntityName = (props: EditableEntityNameProps) => {
  const {
    canEdit,
    icon,
    inputTestId,
    isEditing,
    isFixedWidth,
    isLoading,
    name,
    normalizeName = true,
    onExitEditing,
    onNameSave,
    showEllipsis = false,
    size = "small",
    validateName,
  } = props;

  const inEditMode = canEdit ? isEditing : false;
  const [showTooltip, setShowTooltip] = useState(false);
  const longNameRef = useRef<HTMLDivElement | null>(null);

  const [
    inputRef,
    editableName,
    validationError,
    handleKeyUp,
    handleTitleChange,
  ] = useEditableText(
    inEditMode,
    name,
    onExitEditing,
    validateName,
    onNameSave,
    normalizeName,
  );

  // When in loading state, start icon becomes the loading icon
  const startIcon = useMemo(() => {
    if (isLoading) {
      return <Spinner size={size === "small" ? "sm" : "md"} />;
    }

    return icon;
  }, [isLoading, icon, size]);

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: inputTestId,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: {
        backgroundColor: "var(--ads-v2-color-bg)",
        paddingTop: "4px",
        paddingBottom: "4px",
        top: "-5px",
        placeholder: "Name",
      },
      placeholder: "Name",
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  useEffect(
    function handleShowTooltipOnEllipsis() {
      if (showEllipsis) {
        setShowTooltip(!!isEllipsisActive(longNameRef.current));
      }
    },
    [editableName, showEllipsis],
  );

  return (
    <Styled.Root data-size={size}>
      {startIcon}
      <Tooltip
        content={name}
        isDisabled={!showTooltip}
        key="entity-name"
        mouseEnterDelay={1}
        placement="topLeft"
        showArrow={false}
      >
        <Tooltip
          content={validationError}
          isDisabled={false}
          mouseEnterDelay={0}
          placement="bottom"
          showArrow
          visible={Boolean(validationError)}
        >
          <Styled.Text
            aria-invalid={Boolean(validationError)}
            className={clsx("t--entity-name", { editing: inEditMode })}
            data-isediting={inEditMode}
            data-isfixedwidth={isFixedWidth}
            inputProps={inputProps}
            inputRef={inputRef}
            isEditable={inEditMode}
            kind={size === "small" ? "body-s" : "body-m"}
            ref={showEllipsis ? longNameRef : null}
          >
            {editableName}
          </Styled.Text>
        </Tooltip>
      </Tooltip>
    </Styled.Root>
  );
};
