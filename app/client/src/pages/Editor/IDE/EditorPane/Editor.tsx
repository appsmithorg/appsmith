import React from "react";
import { Flex } from "@appsmith/ads";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "ee/pages/Editor/IDE/EditorPane/constants";
import { JSEditorPane } from "./JS";
import { QueryEditor } from "./Query";
import UIEditor from "./UI/Editor";
import EditorTabs from "../EditorTabs";

const Editor = () => {
  const { path } = useRouteMatch();
  return (
    <Flex
      className="relative"
      flex={1}
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <EditorTabs />
      <Switch>
        <SentryRoute
          component={JSEditorPane}
          path={jsSegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={QueryEditor}
          path={querySegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute component={UIEditor} />
      </Switch>
    </Flex>
  );
};

export default Editor;
