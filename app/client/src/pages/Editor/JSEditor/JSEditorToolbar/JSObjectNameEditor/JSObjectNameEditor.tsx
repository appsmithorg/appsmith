import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { getSavingStatusForJSObjectName } from "selectors/actionSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { Text as ADSText, Flex } from "@appsmith/ads";
import styled from "styled-components";
import { noop } from "lodash";
import { useParams } from "react-router";
import type { AppState } from "ee/reducers";
import {
  getJsCollectionByBaseId,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { JSObjectNameEditor as OldJSObjectNameEditor } from "./old/JSObjectNameEditor";
import { EditableName, useIsRenaming } from "IDE";

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
  color: var(--ads-v2-color-fg);
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

export const JSObjectNameEditor = ({
  disabled,
  saveJSObjectName,
}: JSObjectNameEditorProps) => {
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

  const name = currentJSObjectConfig?.name || "";

  const { enterEditMode, exitEditMode, isEditing } = useIsRenaming(
    currentJSObjectConfig?.id || "",
  );

  const handleDoubleClick = disabled ? noop : enterEditMode;

  const dispatch = useDispatch();

  const handleSaveName = useCallback(
    (name: string) => {
      if (currentJSObjectConfig) {
        dispatch(saveJSObjectName({ id: currentJSObjectConfig.id, name }));
      }
    },
    [currentJSObjectConfig, saveJSObjectName],
  );

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const icon = useMemo(() => {
    if (!currentPlugin) return null;

    return (
      <IconContainer>
        <img
          alt={currentPlugin.name}
          src={getAssetUrl(currentPlugin.iconLocation)}
        />
      </IconContainer>
    );
  }, [currentPlugin]);

  if (!isActionRedesignEnabled) {
    return (
      <OldJSObjectNameEditor
        disabled={disabled}
        saveJSObjectName={saveJSObjectName}
      />
    );
  }

  return (
    <NameWrapper
      data-testid="t--js-object-name-editor"
      onDoubleClick={handleDoubleClick}
    >
      <EditableName
        exitEditing={exitEditMode}
        icon={icon}
        isEditing={isEditing}
        isLoading={isLoading}
        name={name}
        onNameSave={handleSaveName}
      />
    </NameWrapper>
  );
};
