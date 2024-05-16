import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";

import { SentryRoute } from "@appsmith/AppRouter";
import {
  ADD_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import ListWidgets from "./List";
import AddWidgets from "./Add";
import { useSelector } from "react-redux";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasManagePagePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

const UISegment = () => {
  const { path } = useRouteMatch();
  const [focusSearchInput, setFocusSearchInput] = React.useState(false);

  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  if (!canManagePages) {
    return <ListWidgets setFocusSearchInput={setFocusSearchInput} />;
  }

  return (
    <Flex
      className="ide-editor-left-pane__content-widgets"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
    >
      <Switch>
        <SentryRoute
          exact
          path={[
            BUILDER_PATH_DEPRECATED,
            BUILDER_PATH,
            BUILDER_CUSTOM_PATH,
            `${path}${WIDGETS_EDITOR_ID_PATH}${ADD_PATH}`,
          ]}
        >
          <AddWidgets focusSearchInput={focusSearchInput} />
        </SentryRoute>
        <SentryRoute
          exact
          path={[
            `${path}${WIDGETS_EDITOR_BASE_PATH}`,
            `${path}${WIDGETS_EDITOR_ID_PATH}`,
          ]}
        >
          <ListWidgets setFocusSearchInput={setFocusSearchInput} />
        </SentryRoute>
      </Switch>
    </Flex>
  );
};

export default UISegment;
