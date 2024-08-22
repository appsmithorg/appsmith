import React from "react";

import { SentryRoute } from "ee/AppRouter";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "ee/pages/Editor/IDE/EditorPane/constants";
import { Switch, useRouteMatch } from "react-router";

import { Flex } from "@appsmith/ads";

import EditorTabs from "../EditorTabs";
import { useCurrentEditorState } from "../hooks";
import { JSEditorPane } from "./JS";
import { QueryEditor } from "./Query";

const Editor = () => {
  const { path } = useRouteMatch();
  const { segment } = useCurrentEditorState();
  if (segment === EditorEntityTab.UI) {
    return null;
  }
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
      </Switch>
    </Flex>
  );
};

export default Editor;
