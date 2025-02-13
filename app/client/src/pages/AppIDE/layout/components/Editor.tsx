import React from "react";
import { Flex } from "@appsmith/ads";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "ee/AppRouter";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
} from "ee/pages/AppIDE/layouts/constants";
import { JSEditorPane } from "../routers/JSEditor";
import { QueryEditor } from "../routers/QueryEditor";
import EditorTabs from "./EditorTabs";
import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { EditorEntityTab } from "../../../../IDE/Interfaces/EditorTypes";
import styled from "styled-components";

const Container = styled(Flex)`
  // Animating using https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
  & {
    view-transition-name: editor-pane;
  }
`;

const Editor = () => {
  const { path } = useRouteMatch();
  const { segment } = useCurrentEditorState();

  if (segment === EditorEntityTab.UI) {
    return null;
  }

  return (
    <Container
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
    </Container>
  );
};

export default Editor;
