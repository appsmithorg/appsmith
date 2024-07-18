import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { JSExplorer } from "./JS";
import { QueryExplorer } from "./Query";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  return (
    <Flex
      className="relative"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <Switch>
        <SentryRoute
          component={JSExplorer}
          path={jsSegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={QueryExplorer}
          path={querySegmentRoutes.map((route) => `${path}${route}`)}
        />
      </Switch>
    </Flex>
  );
};

export default EditorPaneExplorer;
