import React from "react";
import { Button, Flex } from "design-system";
import type { RouteComponentProps } from "react-router";
import { matchPath, Switch } from "react-router";
import history from "utils/history";
import { globalAddURL } from "@appsmith/RouteBuilder";
import Pages from "pages/Editor/Explorer/Pages";
import { SentryRoute } from "@appsmith/AppRouter";
import { ADD_PATH } from "constants/routes";
import PaneHeader from "../LeftPane/PaneHeader";
import EditorPaneSegments from "./EditorPaneSegments";
import { useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import GlobalAdd from "./GlobalAdd";

const EditorPane = ({
  location: { pathname },
  match: { path },
}: RouteComponentProps) => {
  const pageId = useSelector(getCurrentPageId);
  const isAddPaneMatch = matchPath(pathname, path + ADD_PATH);

  const headerIcon = isAddPaneMatch ? "close-line" : "add-line";
  const onHeaderButtonClick = () => {
    if (isAddPaneMatch) {
      history.goBack();
    } else {
      history.push(globalAddURL({ pageId }));
    }
  };

  return (
    <Flex
      className="ide-pages-pane"
      flexDirection="column"
      gap="spacing-2"
      height="calc(100vh - 77px)"
      width="256px"
    >
      <Pages />
      {/* divider is inside the Pages component */}
      <PaneHeader
        rightIcon={
          <Button
            className={"t--add-editor-button"}
            isIconButton
            kind="secondary"
            onClick={onHeaderButtonClick}
            size="sm"
            startIcon={headerIcon}
          />
        }
        title={isAddPaneMatch ? "Add" : "Editor"}
      />
      <Switch>
        <SentryRoute component={GlobalAdd} exact path={`${path}${ADD_PATH}`} />
        <SentryRoute component={EditorPaneSegments} />
      </Switch>
    </Flex>
  );
};

export default EditorPane;
