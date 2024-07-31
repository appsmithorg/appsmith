import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { JSEditorPane } from "./JS";
import { QueryEditor } from "./Query";
import EditorTabs from "../EditorTabs";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";

const Editor = () => {
  const { path } = useRouteMatch();
  const { segment } = useCurrentEditorState();
  if (segment === EditorEntityTab.UI) {
    return null;
  }
  return (
    <Flex
      className="relative transition-all duration-150"
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
