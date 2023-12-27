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
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import GlobalAdd from "./GlobalAdd";
import { EditorViewMode } from "entities/IDE/constants";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import { setIdeEditorViewMode } from "actions/ideActions";

const EditorPane = ({
  location: { pathname },
  match: { path },
}: RouteComponentProps) => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const isAddPaneMatch = matchPath(pathname, path + ADD_PATH);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);

  const addHeaderIcon = isAddPaneMatch ? "close-line" : "add-line";
  const onGlobalAddButtonClick = () => {
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
      height="100%"
      overflow="hidden"
      width="256px"
    >
      <Pages />
      {/* divider is inside the Pages component */}
      <PaneHeader
        rightIcon={
          <Flex gap="spaces-2">
            {editorMode === EditorViewMode.HalfScreen && isSideBySideEnabled ? (
              <Button
                className={"t--switch-editor-mode-button"}
                isIconButton
                kind="tertiary"
                onClick={() =>
                  dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen))
                }
                size="sm"
                startIcon={"icon-align-right"}
              />
            ) : null}
            <Button
              className={"t--add-editor-button"}
              isIconButton
              kind="secondary"
              onClick={onGlobalAddButtonClick}
              size="sm"
              startIcon={addHeaderIcon}
            />
          </Flex>
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
