import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { useQuerySegmentRoutes } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSegment = () => {
  const { path } = useRouteMatch();
  const routes = useQuerySegmentRoutes(path);
  return (
    <QueriesContainer
      className="ide-editor-left-pane__content-queries"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <Switch>
        {routes.map((route) => (
          <SentryRoute
            component={route.component}
            exact={route.exact}
            key={route.key}
            path={route.path}
          />
        ))}
      </Switch>
    </QueriesContainer>
  );
};

export default QueriesSegment;
