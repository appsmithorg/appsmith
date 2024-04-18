import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { CodeRoutes } from "./CodeRoutes";
import { ListRoutes } from "./ListRoutes";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

export const ListQueriesSegment = () => {
  const { path } = useRouteMatch();
  const routes = ListRoutes(path);
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

export const CodeQuerySegment = () => {
  const { path } = useRouteMatch();
  const routes = CodeRoutes(path);
  return (
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
  );
};
