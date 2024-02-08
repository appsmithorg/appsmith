import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import QueriesSegment from "./Query";
import WidgetsSegment from "./UI";
import JSSegment from "./JS";
import SegmentedHeader from "./components/SegmentedHeader";
import EditorTabs from "../EditorTabs/SplitScreenTabs";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";

const EditorPaneSegments = () => {
  const { path } = useRouteMatch();

  return (
    <Flex
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      overflow="hidden"
    >
      <SegmentedHeader />
      <EditorTabs />
      <Flex
        className="ide-editor-left-pane__content"
        flexDirection="column"
        height="100%"
        overflow="hidden"
        width="100%"
      >
        <Switch>
          <SentryRoute
            component={QueriesSegment}
            path={querySegmentRoutes.map((route) => `${path}${route}`)}
          />
          <SentryRoute
            component={JSSegment}
            path={jsSegmentRoutes.map((route) => `${path}${route}`)}
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
    </Flex>
  );
};

export default EditorPaneSegments;
