import React, { useEffect, useMemo, useRef, useState } from "react";

import { Spinner, Tooltip, type TooltipProps } from "../..";
import { useEditableText } from "../../__hooks__";

import * as Styled from "./EditableEntityName.styles";

import type { EditableEntityNameProps } from "./EditableEntityName.types";

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
      },
      placeholder: "Name",
    }),
    [handleKeyUp, handleTitleChange, inputTestId],
  );

  useEffect(() => {
    setShowTooltip(!!isEllipsisActive(longNameRef.current));
  }, [name]);

  const tooltipProps: TooltipProps = validationError
    ? {
        content: validationError,
        placement: "bottom",
        visible: Boolean(validationError),
        isDisabled: false,
        mouseEnterDelay: 0,
        showArrow: true,
      }
    : {
        content: name,
        placement: "topLeft",
        isDisabled: !showTooltip,
        mouseEnterDelay: 1,
        showArrow: false,
        ...(!showTooltip ? { visible: false } : {}),
      };

  return (
    <Styled.Root data-size={size}>
      {startIcon}
      <Tooltip
        content={tooltipProps.content}
        isDisabled={tooltipProps.isDisabled}
        mouseEnterDelay={tooltipProps.mouseEnterDelay}
        placement={tooltipProps.placement}
        showArrow={tooltipProps.showArrow}
        {...(tooltipProps.visible ? { visible: tooltipProps.visible } : {})}
      >
        <Styled.Text
          aria-invalid={Boolean(validationError)}
          className={`t--entity-name ${inEditMode ? "editing" : ""}`}
          data-isediting={inEditMode}
          data-isfixedwidth={isFixedWidth}
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={inEditMode}
          kind={size === "small" ? "body-s" : "body-m"}
          ref={longNameRef}
        >
          {editableName}
        </Styled.Text>
      </Tooltip>
    </Styled.Root>
  );
};
