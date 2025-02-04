import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useJSAdd } from "ee/pages/AppIDE/EditorPane/JS/hooks";
import { EmptyState } from "@appsmith/ads";

const BlankState: React.FC = () => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const { openAddJS } = useJSAdd();

  const buttonProps = useMemo(
    () => ({
      className: "t--add-item",
      testId: "t--add-item",
      text: createMessage(EDITOR_PANE_TEXTS.js_add_button),
      onClick: canCreateActions ? openAddJS : undefined,
    }),
    [canCreateActions, openAddJS],
  );

  return (
    <EmptyState
      button={buttonProps}
      description={createMessage(EDITOR_PANE_TEXTS.js_blank_state_description)}
      icon={"js-square-v3"}
    />
  );
};

export { BlankState };
