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

export interface SaveActionNameParams {
  id: string;
  name: string;
}

export interface PluginActionNameEditorProps {
  saveActionName: (
    params: SaveActionNameParams,
  ) => ReduxAction<SaveActionNameParams>;
}

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
    <div>
      <ActionNameEditor
        disabled={!isChangePermitted}
        enableFontStyling={plugin?.type === PluginType.API}
        saveActionName={props.saveActionName}
      />
    </div>
  );
};

export default PluginActionNameEditor;
