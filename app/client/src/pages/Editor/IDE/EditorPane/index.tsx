import React from "react";
import { Flex } from "design-system";
import type { RouteComponentProps } from "react-router";
import { Switch } from "react-router";
import { useSelector } from "react-redux";

import Pages from "pages/Editor/Explorer/Pages";
import { SentryRoute } from "@appsmith/AppRouter";
import { ADD_PATH } from "constants/routes";
import EditorPaneSegments from "./EditorPaneSegments";
import GlobalAdd from "./GlobalAdd";
import { useEditorPaneWidth } from "../hooks";
import { getPagesActiveStatus } from "selectors/ideSelectors";

const EditorPane = ({ match: { path } }: RouteComponentProps) => {
  const width = useEditorPaneWidth();
  const active = useSelector(getPagesActiveStatus);
  return (
    <Flex
      className="ide-editor-left-pane"
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      overflow="hidden"
      width={width + "px"}
    >
      {active && <Pages />}
      {/* divider is inside the Pages component */}
      <Switch>
        <SentryRoute component={GlobalAdd} exact path={`${path}${ADD_PATH}`} />
        <SentryRoute component={EditorPaneSegments} />
      </Switch>
    </Flex>
  );
};

export default EditorPane;
