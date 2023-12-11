import React from "react";
import WidgetsEditorEntityExplorer from "../../WidgetsEditorEntityExplorer";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  APP_LIBRARIES_EDITOR_PATH,
  APP_SETTINGS_EDITOR_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_LIST_PATH,
  INTEGRATION_EDITOR_PATH,
  SAAS_GSHEET_EDITOR_ID_PATH,
} from "constants/routes";
import AppSettingsPane from "./AppSettings";
import DataSidePane from "./DataSidePane";
import LibrarySidePane from "./LibrarySidePane";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { useIsAppSidebarEnabled } from "../../../../navigation/featureFlagHooks";
import { PagesPane } from "../PagesPane";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

export const LeftPaneContainer = styled.div`
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
`;

const LeftPane = () => {
  const isAppSidebarEnabled = useIsAppSidebarEnabled();
  const isPagesPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_show_new_sidebar_pages_pane_enabled,
  );
  const { path } = useRouteMatch();
  const guidedTourEnabled = useSelector(inGuidedTour);
  if (!isAppSidebarEnabled || guidedTourEnabled) {
    return isPagesPaneEnabled ? <PagesPane /> : <WidgetsEditorEntityExplorer />;
  }
  return (
    <LeftPaneContainer>
      <Switch>
        <SentryRoute
          component={DataSidePane}
          exact
          path={[
            `${path}${DATA_SOURCES_EDITOR_LIST_PATH}`,
            `${path}${DATA_SOURCES_EDITOR_ID_PATH}`,
            `${path}${INTEGRATION_EDITOR_PATH}`,
            `${path}${SAAS_GSHEET_EDITOR_ID_PATH}`,
          ]}
        />
        <SentryRoute
          component={LibrarySidePane}
          exact
          path={`${path}${APP_LIBRARIES_EDITOR_PATH}`}
        />
        <SentryRoute
          component={AppSettingsPane}
          exact
          path={`${path}${APP_SETTINGS_EDITOR_PATH}`}
        />
        {isPagesPaneEnabled ? (
          <SentryRoute component={PagesPane} />
        ) : (
          <SentryRoute component={WidgetsEditorEntityExplorer} />
        )}
      </Switch>
    </LeftPaneContainer>
  );
};

export default LeftPane;
