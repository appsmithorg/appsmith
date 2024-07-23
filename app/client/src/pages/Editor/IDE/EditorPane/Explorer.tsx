import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { JSExplorer } from "./JS";
import { QueryExplorer } from "./Query";
import WidgetsSegment from "./UI";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import EntityProperties from "pages/Editor/Explorer/Entity/EntityProperties";
import SegmentedHeader from "./components/SegmentedHeader";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  const ideViewMode = useSelector(getIDEViewMode);
  return (
    <Flex className="relative" flexDirection="column" overflow="hidden">
      <SegmentedHeader />
      {/** Entity Properties component is needed to render
       the Bindings popover in the context menu. Will be removed eventually **/}
      <EntityProperties />
      {ideViewMode === EditorViewMode.FullScreen ? (
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
      ) : null}
    </Flex>
  );
};

export default EditorPaneExplorer;
