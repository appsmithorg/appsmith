import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { usePluginActionContext } from "../PluginActionContext";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ActionUrlIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { Spinner, Text as ADSText, Tooltip, Flex } from "@appsmith/ads";
import { usePrevious } from "@mantine/hooks";
import styled from "styled-components";
import { useNameEditor } from "utils/hooks/useNameEditor";
import { useBoolean, useEventCallback, useOnClickOutside } from "usehooks-ts";
import { noop } from "lodash";

export interface SaveActionNameParams {
  id: string;
  name: string;
}

export interface PluginActionNameEditorProps {
  saveActionName: (
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

const PluginActionNameEditor = (props: PluginActionNameEditorProps) => {
  const { action, plugin } = usePluginActionContext();

  const title = action.name;
  const previousTitle = usePrevious(title);
  const [editableTitle, setEditableTitle] = useState(title);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = useSelector(
    (state) => getSavingStatusForActionName(state, action?.id || "").isSaving,
  );

  const { handleNameSave, normalizeName, validateName } = useNameEditor({
    entityId: action.id,
    entityName: title,
    nameSaveAction: props.saveActionName,
  });

  const {
    setFalse: exitEditMode,
    setTrue: enterEditMode,
    value: isEditing,
  } = useBoolean(false);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    action?.userPermissions,
  );

  const currentTitle =
    isEditing || isLoading || title !== editableTitle ? editableTitle : title;
  const iconUrl = getAssetUrl(plugin?.iconLocation) || "";
  const icon = ActionUrlIcon(iconUrl);

  const attemptToSave = () => {
    const nameError = validateName(editableTitle);

    if (nameError !== null) {
      setValidationError(nameError);
    } else {
      exitEditMode();
      handleNameSave(editableTitle);
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
      setEditableTitle(normalizeName(e.target.value));
    },
  );

  const handleEnterEditMode = useEventCallback(() => {
    setEditableTitle(title);
    enterEditMode();
  });

  const handleDoubleClick = isChangePermitted ? handleEnterEditMode : noop;

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

  useEffect(() => {
    if (!isEditing && previousTitle !== title) {
      setEditableTitle(title);
    }
  }, [title, previousTitle, isEditing]);

  useEffect(() => {
    const input = inputRef.current;

    if (isEditing && input) {
      setTimeout(() => {
        input.focus();
      }, 200);
    }
  }, [isEditing]);

  return (
    <NameWrapper onDoubleClick={handleDoubleClick}>
      {icon && !isLoading ? <IconContainer>{icon}</IconContainer> : null}
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

export default PluginActionNameEditor;
