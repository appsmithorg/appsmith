import React, { useEffect, useMemo, useRef, useState } from "react";

import clsx from "classnames";
import { noop } from "lodash";

import { Icon, Spinner, Tooltip } from "@appsmith/ads";
import { sanitizeString } from "utils/URLUtils";
import { useBoolean, useEventCallback, useEventListener } from "usehooks-ts";
import { usePrevious } from "@mantine/hooks";

import * as Styled from "./styles";
import { DATA_TEST_ID } from "./constants";

export interface FileTabProps {
  isActive: boolean;
  isChangePermitted?: boolean;
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
  isChangePermitted = false,
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

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (editorConfig) {
          const { onTitleSave, validateTitle } = editorConfig;
          const nameError = validateTitle(editableTitle);

          if (nameError === null) {
            exitEditMode();
            onTitleSave(editableTitle);
          } else {
            setValidationError(nameError);
          }
        }
      } else if (e.key === "Escape") {
        exitEditMode();
        setEditableTitle(title);
        setValidationError(null);
      } else {
        setValidationError(null);
      }
    },
  );

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

  const handleDoubleClick =
    editorConfig && isChangePermitted ? handleEnterEditMode : noop;

  const inputProps = useMemo(
    () => ({
      ["data-testid"]: DATA_TEST_ID.INPUT,
      onKeyUp: handleKeyUp,
      onChange: handleTitleChange,
      autoFocus: true,
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        left: -1,
        top: -1,
      },
    }),
    [handleKeyUp, handleTitleChange],
  );

  useEventListener(
    "focusout",
    function handleFocusOut() {
      if (isEditing && editorConfig) {
        const { onTitleSave, validateTitle } = editorConfig;
        const nameError = validateTitle(editableTitle);

        exitEditMode();

        if (nameError === null) {
          onTitleSave(editableTitle);
        } else {
          setEditableTitle(title);
          setValidationError(null);
        }
      }
    },
    inputRef,
  );

  useEffect(
    function syncEditableTitle() {
      if (!isEditing && previousTitle !== title) {
        setEditableTitle(title);
      }
    },
    [title, previousTitle, isEditing],
  );

  // TODO: This is a temporary fix to focus the input after context retention applies focus to its target
  // this is a nasty hack to re-focus the input after context retention applies focus to its target
  // this will be addressed in a future task, likely by a focus retention modification
  useEffect(
    function recaptureFocusInEventOfFocusRetention() {
      const input = inputRef.current;

      if (isEditing && input) {
        setTimeout(() => {
          input.focus();
        }, 200);
      }
    },
    [isEditing],
  );

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
      {isLoading && <Spinner data-testid={DATA_TEST_ID.SPINNER} size="sm" />}

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

      <Styled.CloseButton
        aria-label="Close tab"
        className="tab-close"
        data-testid={DATA_TEST_ID.CLOSE_BUTTON}
        onClick={onClose}
      >
        <Icon name="close-line" />
      </Styled.CloseButton>
    </Styled.Tab>
  );
};
