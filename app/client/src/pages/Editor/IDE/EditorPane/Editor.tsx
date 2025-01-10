import React, { Suspense } from "react";
import { Flex } from "@appsmith/ads";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute, loadingIndicator } from "ce/AppRouter";
import { editorRoutes } from "../EditorRoutes";
import EditorTabs from "../EditorTabs";
import { useCurrentEditorState } from "../hooks";
import { EditorEntityTab } from "ce/entities/IDE/constants";
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
      <Suspense fallback={loadingIndicator}>
        <Switch>
          {editorRoutes.map((route) => (
            <SentryRoute
              key={route.key}
              component={route.component}
              exact={route.exact}
              path={`${path}${route.path}`}
            />
          ))}
        </Switch>
      </Suspense>
    </Container>
  );
};

export default Editor;
