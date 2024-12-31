import React from "react";
import { ExplorerContainer } from "@appsmith/ads";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "ee/pages/Editor/IDE/EditorPane/constants";
import { JSExplorer } from "./JS";
import { QueryExplorer } from "./Query";
import WidgetsSegment from "./UI";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import SegmentSwitcher from "./components/SegmentSwitcher";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { DEFAULT_EXPLORER_PANE_WIDTH } from "constants/AppConstants";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  const ideViewMode = useSelector(getIDEViewMode);

  return (
    <ExplorerContainer
      borderRight={
        ideViewMode === EditorViewMode.SplitScreen ? "NONE" : "STANDARD"
      }
      className="ide-editor-left-pane__content"
      width={
        ideViewMode === EditorViewMode.FullScreen
          ? DEFAULT_EXPLORER_PANE_WIDTH
          : "100%"
      }
    >
      <SegmentSwitcher />
      <Switch>
        <SentryRoute
          component={JSExplorer}
          path={jsSegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={QueryExplorer}
          path={querySegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={WidgetsSegment}
          path={[
            BUILDER_PATH,
            BUILDER_CUSTOM_PATH,
            BUILDER_PATH_DEPRECATED,
            ...widgetSegmentRoutes.map((route) => `${path}${route}`),
          ]}
        />
      </Switch>
    </ExplorerContainer>
  );
};

export default EditorPaneExplorer;
