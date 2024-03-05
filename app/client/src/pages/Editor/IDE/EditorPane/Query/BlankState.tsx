import React from "react";
import { useSelector } from "react-redux";

import { EDITOR_PANE_TEXTS, createMessage } from "@appsmith/constants/messages";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { EmptyState } from "../components/EmptyState";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

const BlankState: React.FC = () => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const addButtonClickHandler = useQueryAdd();

  return (
    <EmptyState
      buttonClassName="t--add-item"
      buttonText={createMessage(EDITOR_PANE_TEXTS.query_add_button)}
      description={createMessage(
        EDITOR_PANE_TEXTS.query_blank_state_description,
      )}
      icon={"queries-v3"}
      onClick={canCreateActions ? addButtonClickHandler : undefined}
    />
  );
};

export { BlankState };
