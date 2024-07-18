import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { jsSegmentRoutes } from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { JSEditorPane } from "./JS";
import EditorTabs from "../EditorTabs";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  return (
    <Flex
      className="relative"
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
      </Switch>
    </Flex>
  );
};

export default EditorPaneExplorer;
