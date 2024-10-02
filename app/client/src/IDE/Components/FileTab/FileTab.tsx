import React, { useEffect, useMemo, useRef, useState } from "react";

import clsx from "classnames";
import { noop } from "lodash";

import { Icon, Spinner, Tooltip } from "@appsmith/ads";
import { sanitizeString } from "utils/URLUtils";
import { useBoolean, useEventCallback, useOnClickOutside } from "usehooks-ts";
import { usePrevious } from "@mantine/hooks";

import * as Styled from "./styles";

interface FileTabProps {
  isActive: boolean;
  isLoading?: boolean;
  title: string;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  icon?: React.ReactNode;
  editorConfig?: {
    /** Triggered on enter or click outside */
    onTitleSave: (name: string) => void;
    /** Used to normalize title (remove white spaces etc.) */
    titleTransformer: (name: string) => string;
    /** Validates title and returns an error message or null */
    validateTitle: (name: string) => string | null;
  };
}

export const FileTab = ({
  editorConfig,
  icon,
  isActive,
  isLoading = false,
  onClick,
  onClose,
  title,
}: FileTabProps) => {
  const {
    setFalse: exitEditMode,
    setTrue: enterEditMode,
    value: isEditing,
  } = useBoolean(false);

  const previousTitle = usePrevious(title);
  const [editableTitle, setEditableTitle] = useState(title);
  const currentTitle =
    isEditing || isLoading || title !== editableTitle ? editableTitle : title;
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const attemptToSave = () => {
    if (editorConfig) {
      const { onTitleSave, validateTitle } = editorConfig;
      const nameError = validateTitle(editableTitle);

      if (nameError !== null) {
        setValidationError(nameError);
      } else {
        exitEditMode();
        onTitleSave(editableTitle);
      }
    }
  };

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        attemptToSave();
      } else if (e.key === "Escape") {
        exitEditMode();
        setEditableTitle(title);
        setValidationError(null);
      } else {
        setValidationError(null);
      }
    },
  );

  useOnClickOutside(inputRef, () => {
    attemptToSave();
  });

  const handleTitleChange = useEventCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditableTitle(
        editorConfig
          ? editorConfig.titleTransformer(e.target.value)
          : e.target.value,
      );
    },
  );

  const handleEnterEditMode = useEventCallback(() => {
    setEditableTitle(title);
    enterEditMode();
  });

  const handleDoubleClick = editorConfig ? handleEnterEditMode : noop;

  const handleOnClose = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(e);
  });

  const inputProps = useMemo(
    () => ({
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: {
        left: -1,
      },
    }),
    [handleKeyUp, handleTitleChange],
  );

  useEffect(() => {
    if (!isEditing && previousTitle !== title) {
      setEditableTitle(title);
    }
  }, [title, previousTitle, isEditing]);

  // this is a nasty hack to re-focus the input after context retention applies the focus
  // it will be addressed soon, likely by a focus retention modification
  useEffect(() => {
    const input = inputRef.current;

    if (isEditing && input) {
      setTimeout(() => {
        input.focus();
      }, 200);
    }
  }, [isEditing]);

  return (
    <Styled.Tab
      className={clsx("editor-tab", isActive && "active")}
      data-testid={`t--ide-tab-${sanitizeString(title)}`}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {icon && !isLoading ? (
        <Styled.IconContainer>{icon}</Styled.IconContainer>
      ) : null}
      {isLoading && <Spinner size="sm" />}

      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Styled.Text
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={isEditing}
          kind="body-s"
        >
          {currentTitle}
        </Styled.Text>
      </Tooltip>

      {/* not using button component because of the size not matching design */}
      <Icon
        className="tab-close rounded-[4px] hover:bg-[var(--ads-v2-colors-action-tertiary-surface-hover-bg)] cursor-pointer p-[2px]"
        data-testid="t--tab-close-btn"
        name="close-line"
        onClick={handleOnClose}
      />
    </Styled.Tab>
  );
};
