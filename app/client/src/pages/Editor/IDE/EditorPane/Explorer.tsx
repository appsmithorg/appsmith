import React from "react";
import { Flex } from "@appsmith/ads";
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
import EntityProperties from "pages/Editor/Explorer/Entity/EntityProperties";
import SegmentedHeader from "./components/SegmentedHeader";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import { DEFAULT_EXPLORER_PANE_WIDTH } from "constants/AppConstants";

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
      width={
        ideViewMode === EditorViewMode.FullScreen
          ? DEFAULT_EXPLORER_PANE_WIDTH
          : "100%"
      }
    >
      <SegmentedHeader />
      {/** Entity Properties component is needed to render
       the Bindings popover in the context menu. Will be removed eventually **/}
      <EntityProperties />
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
