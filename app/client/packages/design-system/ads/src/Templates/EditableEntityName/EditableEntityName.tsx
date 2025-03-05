import React, { useEffect, useMemo, useRef, useState } from "react";

import { Spinner } from "../../Spinner";
import { Tooltip, type TooltipProps } from "../../Tooltip";
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
    normalizeName = false,
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

  // Tooltip can either show the validation error or the name incase of long names
  // Maybe we should use two different tooltips for this @Ankita
  const tooltipProps: TooltipProps = useMemo(
    () =>
      validationError
        ? {
            content: validationError,
            placement: "bottom",
            visible: true,
            isDisabled: false,
            mouseEnterDelay: 0,
            showArrow: true,
          }
        : {
            content: name,
            placement: "topLeft",
            visible: !showTooltip,
            isDisabled: !showTooltip,
            mouseEnterDelay: 1,
            showArrow: false,
          },
    [name, showTooltip, validationError],
  );

  return (
    <Styled.Root data-size={size}>
      {startIcon}
      <Tooltip {...tooltipProps}>
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
    </Styled.Root>
  );
};
