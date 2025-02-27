import React, { useMemo } from "react";
import { ExplorerContainer } from "@appsmith/ads";
import { Switch, useRouteMatch } from "react-router";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "ee/pages/AppIDE/layouts/constants";
import { JSExplorer } from "../../components/JSExplorer";
import { QueryExplorer } from "../../components/QueryExplorer";
import WidgetsSegment from "../routers/UISegmentLeftPane/UISegmentLeftPane";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "ee/constants/routes/appRoutes";
import SegmentSwitcher from "./SegmentSwitcher/SegmentSwitcher";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorEntityTab, EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { DEFAULT_EXPLORER_PANE_WIDTH } from "constants/AppConstants";
import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { SentryRoute } from "components/SentryRoute";

const EditorPaneExplorer = () => {
  const { path } = useRouteMatch();
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();

  const widgetSegmentPaths = useMemo(
    () => [
      BUILDER_PATH,
      BUILDER_CUSTOM_PATH,
      BUILDER_PATH_DEPRECATED,
      ...widgetSegmentRoutes.map((route) => `${path}${route}`),
    ],
    [path],
  );

  return (
    <ExplorerContainer
      borderRight={
        ideViewMode === EditorViewMode.SplitScreen ||
        segment === EditorEntityTab.UI
          ? "NONE"
          : "STANDARD"
      }
      className="ide-editor-left-pane__content"
      width={
        ideViewMode === EditorViewMode.FullScreen
          ? DEFAULT_EXPLORER_PANE_WIDTH
          : "100%"
      }
    >
      <SegmentSwitcher />
      <Switch>
        <SentryRoute
          component={JSExplorer}
          path={jsSegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute
          component={QueryExplorer}
          path={querySegmentRoutes.map((route) => `${path}${route}`)}
        />
        <SentryRoute component={WidgetsSegment} path={widgetSegmentPaths} />
      </Switch>
    </ExplorerContainer>
  );
};

export default EditorPaneExplorer;
