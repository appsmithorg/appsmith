import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { usePluginActionContext } from "../PluginActionContext";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { getSavingStatusForActionName } from "selectors/actionSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ActionUrlIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { Text as ADSText, Flex } from "@appsmith/ads";
import styled from "styled-components";
import { useBoolean } from "usehooks-ts";
import { noop } from "lodash";
import { EditableName } from "IDE";

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

const PluginActionNameEditor = ({
  saveActionName,
}: PluginActionNameEditorProps) => {
  const { action, plugin } = usePluginActionContext();

  const isLoading = useSelector(
    (state) => getSavingStatusForActionName(state, action?.id || "").isSaving,
  );

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
  const iconUrl = getAssetUrl(plugin?.iconLocation) || "";
  const icon = ActionUrlIcon(iconUrl);

  const handleDoubleClick = isChangePermitted ? enterEditMode : noop;

  const handleNameSave = useCallback(
    (name: string) => {
      saveActionName({ id: action.id, name });
    },
    [action.id, saveActionName],
  );

  return (
    <NameWrapper onDoubleClick={handleDoubleClick}>
      <EditableName
        exitEditing={exitEditMode}
        icon={<IconContainer>{icon}</IconContainer>}
        isEditing={isEditing}
        isLoading={isLoading}
        name={action.name}
        onNameSave={handleNameSave}
      />
    </NameWrapper>
  );
};

export default PluginActionNameEditor;
