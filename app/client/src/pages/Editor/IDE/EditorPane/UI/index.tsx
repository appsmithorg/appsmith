import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";

import { SentryRoute } from "@appsmith/AppRouter";
import {
  ADD_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import ListWidgets from "./List";
import AddWidgets from "./Add";

const UISegment = () => {
  const { path } = useRouteMatch();

  return (
    <Flex
      className="ide-editor-left-pane__content-widgets"
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
    >
      <Switch>
        <SentryRoute
          component={AddWidgets}
          exact
          path={[
            BUILDER_PATH_DEPRECATED,
            BUILDER_PATH,
            BUILDER_CUSTOM_PATH,
            `${path}${WIDGETS_EDITOR_ID_PATH}${ADD_PATH}`,
          ]}
        />
        <SentryRoute
          component={ListWidgets}
          exact
          path={[
            `${path}${WIDGETS_EDITOR_BASE_PATH}`,
            `${path}${WIDGETS_EDITOR_ID_PATH}`,
          ]}
        />
      </Switch>
    </Flex>
  );
};

export default UISegment;
