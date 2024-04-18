import { Flex } from "design-system";
import React from "react";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import EditorTabs from "../EditorTabs/SplitScreenTabs";
import SegmentedHeader from "./components/SegmentedHeader";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { CodeQuerySegment, ListQueriesSegment } from "./Query";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import { CodeJSSegment, ListJSSegment } from "./JS";
import WidgetsSegment from "./UI";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import {
  DEFAULT_EDITOR_PANE_WIDTH,
  DEFAULT_SPLIT_SCREEN_WIDTH,
} from "constants/AppConstants";
import { useCurrentEditorState } from "../hooks";

export const SideBySideEditorPane = () => {
  const editorMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const { path } = useRouteMatch();
  return (
    <Flex
      flexDirection={
        editorMode === EditorViewMode.SplitScreen ? "column" : "row"
      }
      height="100%"
    >
      <Flex
        borderRight={"1px solid var(--ads-v2-color-border)"}
        flexDirection="column"
        height="100%"
      >
        <SegmentedHeader />
        {editorMode === EditorViewMode.FullScreen && (
          <Flex
            className="ide-editor-left-pane__content"
            flexDirection="column"
            height="100%"
            overflow="hidden"
            width={`${DEFAULT_EDITOR_PANE_WIDTH}px`}
          >
            <Switch>
              <SentryRoute
                component={ListQueriesSegment}
                path={querySegmentRoutes.map((route) => `${path}${route}`)}
              />
              <SentryRoute
                component={ListJSSegment}
                path={jsSegmentRoutes.map((route) => `${path}${route}`)}
              />
              <SentryRoute
                component={WidgetsSegment}
                path={[
                  BUILDER_PATH,
                  BUILDER_CUSTOM_PATH,
                  BUILDER_PATH_DEPRECATED,
                  ...widgetSegmentRoutes.map((route) => `${path}${route}`),
                ]}
              />
            </Switch>
          </Flex>
        )}
      </Flex>
      <Flex flex={1} flexDirection="column" height="100%">
        <EditorTabs />
        {segment !== EditorEntityTab.UI && (
          <Flex
            className="ide-editor-left-pane__content"
            flexDirection="column"
            height="100%"
            overflow="hidden"
            width={
              editorMode === EditorViewMode.FullScreen
                ? "100%"
                : DEFAULT_SPLIT_SCREEN_WIDTH
            }
          >
            <Switch>
              <SentryRoute
                component={CodeQuerySegment}
                path={querySegmentRoutes.map((route) => `${path}${route}`)}
              />
              <SentryRoute
                component={CodeJSSegment}
                path={jsSegmentRoutes.map((route) => `${path}${route}`)}
              />
            </Switch>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
