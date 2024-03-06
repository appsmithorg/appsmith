import React from "react";
import { useSelector } from "react-redux";

import { EDITOR_PANE_TEXTS, createMessage } from "@appsmith/constants/messages";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { EmptyState } from "../components/EmptyState";

const BlankState: React.FC = () => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const addButtonClickHandler = useJSAdd();

  return (
    <EmptyState
      buttonClassName="t--add-item"
      buttonText={createMessage(EDITOR_PANE_TEXTS.js_add_button)}
      description={createMessage(EDITOR_PANE_TEXTS.js_blank_state_description)}
      icon={"js-square-v3"}
      onClick={canCreateActions ? addButtonClickHandler : undefined}
    />
  );
};

export { BlankState };
