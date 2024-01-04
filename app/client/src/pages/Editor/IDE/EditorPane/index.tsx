import React from "react";
import { Flex } from "design-system";
import type { RouteComponentProps } from "react-router";
import { Switch } from "react-router";
import Pages from "pages/Editor/Explorer/Pages";
import { SentryRoute } from "@appsmith/AppRouter";
import { ADD_PATH } from "constants/routes";
import EditorPaneSegments from "./EditorPaneSegments";
import GlobalAdd from "./GlobalAdd";

const EditorPane = ({ match: { path } }: RouteComponentProps) => {
  return (
    <Flex
      className="ide-pages-pane"
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      overflow="hidden"
      width="255px"
    >
      <Pages />
      {/* divider is inside the Pages component */}
      <Switch>
        <SentryRoute component={GlobalAdd} exact path={`${path}${ADD_PATH}`} />
        <SentryRoute component={EditorPaneSegments} />
      </Switch>
    </Flex>
  );
};

export default EditorPane;
