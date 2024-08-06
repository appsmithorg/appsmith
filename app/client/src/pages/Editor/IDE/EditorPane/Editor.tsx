import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "ee/pages/Editor/IDE/EditorPane/constants";
import { JSEditorPane } from "./JS";
import { QueryEditor } from "./Query";
import EditorTabs from "../EditorTabs";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab } from "ee/entities/IDE/constants";

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
