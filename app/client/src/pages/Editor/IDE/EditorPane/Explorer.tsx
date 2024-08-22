import React from "react";

import { DEFAULT_EXPLORER_PANE_WIDTH } from "constants/AppConstants";
import { SentryRoute } from "ee/AppRouter";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import { EditorViewMode } from "ee/entities/IDE/constants";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "ee/pages/Editor/IDE/EditorPane/constants";
import { useSelector } from "react-redux";
import { Switch, useRouteMatch } from "react-router";
import { getIDEViewMode } from "selectors/ideSelectors";

import { Flex } from "@appsmith/ads";

import { JSExplorer } from "./JS";
import { QueryExplorer } from "./Query";
import WidgetsSegment from "./UI";
import SegmentedHeader from "./components/SegmentedHeader";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  const ideViewMode = useSelector(getIDEViewMode);
  return (
    <Flex
      borderRight={
        ideViewMode === EditorViewMode.SplitScreen
          ? ""
          : "1px solid var(--ads-v2-color-border)"
      }
      className="relative ide-editor-left-pane__content"
      flexDirection="column"
      overflow="hidden"
      width={
        ideViewMode === EditorViewMode.FullScreen
          ? DEFAULT_EXPLORER_PANE_WIDTH
          : "100%"
      }
    >
      <SegmentedHeader />
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
    </Flex>
  );
};

export default EditorPaneExplorer;
