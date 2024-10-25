import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { getSavingStatusForJSObjectName } from "selectors/actionSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Spinner, Text as ADSText, Tooltip, Flex } from "@appsmith/ads";
import { usePrevious } from "@mantine/hooks";
import styled from "styled-components";
import { useNameEditor } from "utils/hooks/useNameEditor";
import { useBoolean, useEventCallback, useEventListener } from "usehooks-ts";
import { noop } from "lodash";
import { useParams } from "react-router";
import type { AppState } from "ee/reducers";
import {
  getJsCollectionByBaseId,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { JSObjectNameEditor as OldJSObjectNameEditor } from "./old/JSObjectNameEditor";

export interface SaveActionNameParams {
  id: string;
  name: string;
}

export interface JSObjectNameEditorProps {
  disabled?: boolean;
  saveJSObjectName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

export const NameWrapper = styled(Flex)`
  height: 100%;
  position: relative;
  font-size: 12px;
  color: var(--ads-v2-colors-text-default);
  cursor: pointer;
  gap: var(--ads-v2-spaces-2);
  align-items: center;
  justify-content: center;
  padding: var(--ads-v2-spaces-3);
`;

export const IconContainer = styled.div`
  height: 12px;
  width: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  img {
    width: 12px;
  }
`;

export const Text = styled(ADSText)`
  min-width: 3ch;
  padding: 0 var(--ads-v2-spaces-1);
  font-weight: 500;
`;

export const JSObjectNameEditor = (props: JSObjectNameEditorProps) => {
  const params = useParams<{
    baseCollectionId?: string;
    baseQueryId?: string;
  }>();

  const currentJSObjectConfig = useSelector((state: AppState) =>
    getJsCollectionByBaseId(state, params.baseCollectionId || ""),
  );

  const currentPlugin = useSelector((state: AppState) =>
    getPlugin(state, currentJSObjectConfig?.pluginId || ""),
  );

  const isLoading = useSelector(
    (state) =>
      getSavingStatusForJSObjectName(state, currentJSObjectConfig?.id || "")
        .isSaving,
  );

  const title = currentJSObjectConfig?.name || "";
  const previousTitle = usePrevious(title);
  const [editableTitle, setEditableTitle] = useState(title);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { handleNameSave, normalizeName, validateName } = useNameEditor({
    entityId: params?.baseCollectionId || "",
    entityName: title,
    nameSaveAction: props.saveJSObjectName,
  });

  const {
    setFalse: exitEditMode,
    setTrue: enterEditMode,
    value: isEditing,
  } = useBoolean(false);

  const currentTitle =
    isEditing || isLoading || title !== editableTitle ? editableTitle : title;

  const handleKeyUp = useEventCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const nameError = validateName(editableTitle);

        if (nameError === null) {
          exitEditMode();
          handleNameSave(editableTitle);
        } else {
          setValidationError(nameError);
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
      setEditableTitle(normalizeName(e.target.value));
    },
  );

  const handleEnterEditMode = useEventCallback(() => {
    setEditableTitle(title);
    enterEditMode();
  });

  const handleDoubleClick = props.disabled ? noop : handleEnterEditMode;

  const inputProps = useMemo(
    () => ({
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
      if (isEditing) {
        const nameError = validateName(editableTitle);

        exitEditMode();

        if (nameError === null) {
          handleNameSave(editableTitle);
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

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (!isActionRedesignEnabled) {
    return (
      <OldJSObjectNameEditor
        disabled={props.disabled}
        saveJSObjectName={props.saveJSObjectName}
      />
    );
  }

  return (
    <NameWrapper onDoubleClick={handleDoubleClick}>
      {currentPlugin && !isLoading ? (
        <IconContainer>
          <img
            alt={currentPlugin.name}
            src={getAssetUrl(currentPlugin.iconLocation)}
          />
        </IconContainer>
      ) : null}
      {isLoading && <Spinner size="sm" />}

      <Tooltip content={validationError} visible={Boolean(validationError)}>
        <Text
          inputProps={inputProps}
          inputRef={inputRef}
          isEditable={isEditing}
          kind="body-s"
        >
          {currentTitle}
        </Text>
      </Tooltip>
    </NameWrapper>
  );
};
