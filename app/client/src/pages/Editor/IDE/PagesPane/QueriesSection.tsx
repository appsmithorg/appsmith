import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { Switch, useRouteMatch } from "react-router";

import { PAGEPANE_ADD_PATH } from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import { AddQuerySection } from "./AddQuerySection";
import { ListQuerySection } from "./ListQuerySection";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

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
      gap="spaces-3"
      overflow="scroll"
    >
      <Switch>
        <SentryRoute
          component={AddQuerySection}
          exact
          path={`${path}${PAGEPANE_ADD_PATH}`}
        />
        <SentryRoute component={ListQuerySection} />
      </Switch>
    </QueriesContainer>
  );
};

export { QueriesSection };
