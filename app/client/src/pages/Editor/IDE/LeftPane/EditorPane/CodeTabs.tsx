import React from "react";
import { CombinedFileTabs } from "../../EditorTabs/CombinedFileTabs";
import { Flex } from "design-system";
import { Switch } from "react-router-dom";
import { SentryRoute } from "@appsmith/AppRouter";
import QueriesSegment from "../../EditorPane/Query";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import JSSegment from "../../EditorPane/JS";
import { useRouteMatch } from "react-router";

export const CodeTabs = () => {
  const { path } = useRouteMatch();
  return (
    <Flex flexDirection="column" height="100%" overflow="hidden" width="100%">
      <CombinedFileTabs />
      <Switch>
        <SentryRoute
          component={QueriesSegment}
          path={querySegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={JSSegment}
          path={jsSegmentRoutes.map((route) => `${path}${route}`)}
        />
      </Switch>
    </Flex>
  );
};
