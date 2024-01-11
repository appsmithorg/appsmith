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
import {
  getIsSideBySideEnabled,
  getPagesActiveStatus,
} from "selectors/ideSelectors";
import EntityProperties from "pages/Editor/Explorer/Entity/EntityProperties";

const EditorPane = ({ match: { path } }: RouteComponentProps) => {
  const width = useEditorPaneWidth();
  const pagesActive = useSelector(getPagesActiveStatus);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);

  const PagesRender = () => {
    if (!isSideBySideEnabled) {
      return <Pages />;
    } else if (isSideBySideEnabled && pagesActive) {
      /* This below pages component will get changed */
      return <Pages />;
    } else {
      return null;
    }
  };

  return (
    <Flex
      className="ide-editor-left-pane"
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      overflow="hidden"
      width={width + "px"}
    >
      {/** Entity Properties component is needed to render
        the Bindings popover in the context menu. Will be removed eventually **/}
      <EntityProperties />
      <PagesRender />
      {/* divider is inside the Pages component */}
      <Switch>
        <SentryRoute component={GlobalAdd} exact path={`${path}${ADD_PATH}`} />
        <SentryRoute component={EditorPaneSegments} />
      </Switch>
    </Flex>
  );
};

export default EditorPane;
