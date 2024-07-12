import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import QueriesSegment from "./Query/Editor";
import JSSegment from "./JS/Editor";
import EditorTabs from "../EditorTabs";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import SegmentedHeader from "./components/SegmentedHeader";

const CodeEditor = () => {
  const { path } = useRouteMatch();
  const ideViewMode = useSelector(getIDEViewMode);

  return (
    <Flex
      className="relative"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      {ideViewMode === EditorViewMode.SplitScreen ? <SegmentedHeader /> : null}
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
        </Switch>
      </Flex>
    </Flex>
  );
};

export default CodeEditor;
