import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { EmptyState } from "@appsmith/ads";
import { useQueryAdd } from "ee/pages/Editor/IDE/EditorPane/Query/hooks";

const BlankState: React.FC = () => {
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const { openAddQuery } = useQueryAdd();

  const buttonProps = useMemo(
    () => ({
      className: "t--add-item",
      testId: "t--add-item",
      text: createMessage(EDITOR_PANE_TEXTS.query_add_button),
      onClick: canCreateActions ? openAddQuery : undefined,
    }),
    [canCreateActions, openAddQuery],
  );

  return (
    <EmptyState
      button={buttonProps}
      description={createMessage(
        EDITOR_PANE_TEXTS.query_blank_state_description,
      )}
      icon={"queries-v3"}
    />
  );
};

export { BlankState };
