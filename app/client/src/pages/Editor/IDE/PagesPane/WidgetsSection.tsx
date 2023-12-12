import React from "react";
import styled from "styled-components";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";

import { SentryRoute } from "@appsmith/AppRouter";
import { ADD_PATH, WIDGETS_EDITOR_ID_PATH } from "constants/routes";
import { ListWidgets } from "./ListWidgets";
import { AddWidgets } from "./AddWidgets";

const WidgetsContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 4px auto 1fr auto auto auto auto auto;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const WidgetsSection = () => {
  const { path } = useRouteMatch();

  return (
    <WidgetsContainer
      className="ide-pages-pane__content-widgets"
      flexDirection="column"
      gap="spaces-3"
      overflow="scroll"
    >
      <Switch>
        <SentryRoute
          component={AddWidgets}
          exact
          path={[
            `${path}${ADD_PATH}`,
            `${path}${WIDGETS_EDITOR_ID_PATH}${ADD_PATH}`,
          ]}
        />
        <SentryRoute component={ListWidgets} />
      </Switch>
    </WidgetsContainer>
  );
};

export { WidgetsSection };
