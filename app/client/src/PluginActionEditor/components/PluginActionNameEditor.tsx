import React from "react";
import { useSelector } from "react-redux";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import { usePluginActionContext } from "PluginActionEditor/PluginActionContext";
import { getActionByBaseId } from "ee/selectors/entitiesSelector";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasManageActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { PluginType } from "entities/Action";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import styled from "styled-components";

export interface SaveActionNameParams {
  id: string;
  name: string;
}

export interface PluginActionNameEditorProps {
  saveActionName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

const ActionNameEditorWrapper = styled.div`
  & .ads-v2-box {
    gap: var(--ads-v2-spaces-2);
  }

  && .t--action-name-edit-field {
    font-size: 12px;

    .bp3-editable-text-content {
      height: unset !important;
      line-height: unset !important;
    }
  }

  & .t--plugin-icon-box {
    height: 12px;
    width: 12px;

    img {
      width: 12px;
      height: auto;
    }
  }
`;

const PluginActionNameEditor = (props: PluginActionNameEditorProps) => {
  const { action, plugin } = usePluginActionContext();
  const currentActionConfig = useSelector((state) =>
    action.baseId ? getActionByBaseId(state, action.baseId) : undefined,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  return (
    <ActionNameEditorWrapper>
      <ActionNameEditor
        disabled={!isChangePermitted}
        enableFontStyling={plugin?.type === PluginType.API}
        saveActionName={props.saveActionName}
      />
    </ActionNameEditorWrapper>
  );
};

export default PluginActionNameEditor;
