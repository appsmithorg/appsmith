import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";

import { ADD_PATH } from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import { AddQuery } from "./AddQuery";
import { ListQuery } from "./ListQuery";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSection = () => {
  const { path } = useRouteMatch();

  return (
    <QueriesContainer
      className="ide-pages-pane__content-queries"
      flexDirection="column"
      overflow="hidden"
    >
      <Switch>
        <SentryRoute
          component={AddQuery}
          exact
          path={[`${path}${ADD_PATH}`, `${path}/:queryId/add`]}
        />
        <SentryRoute component={ListQuery} />
      </Switch>
    </QueriesContainer>
  );
};

export { QueriesSection };
