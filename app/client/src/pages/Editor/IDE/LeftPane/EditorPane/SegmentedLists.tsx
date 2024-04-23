import React from "react";
import { Switch } from "react-router-dom";
import { SentryRoute } from "@appsmith/AppRouter";
import { Flex } from "design-system";
import { useSelector } from "react-redux";
import {
  jsSegmentRoutes,
  querySegmentRoutes,
  widgetSegmentRoutes,
} from "@appsmith/pages/Editor/IDE/EditorPane/constants";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "@appsmith/constants/routes/appRoutes";
import { getIDEViewMode } from "selectors/ideSelectors";
import { useRouteMatch } from "react-router";
import SegmentedHeader from "../../EditorPane/components/SegmentedHeader";
import ListQuery from "../../EditorPane/Query/List";
import ListJSObjects from "../../EditorPane/JS/List";
import WidgetsSegment from "../../EditorPane/UI";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import {
  DEFAULT_EDITOR_PANE_WIDTH,
  DEFAULT_SPLIT_SCREEN_WIDTH,
} from "constants/AppConstants";

export const SegmentedLists = () => {
  const { path } = useRouteMatch();
  const editorMode = useSelector(getIDEViewMode);

  return (
    <Flex
      flexDirection="column"
      width={
        editorMode === EditorViewMode.FullScreen
          ? DEFAULT_EDITOR_PANE_WIDTH + "px"
          : DEFAULT_SPLIT_SCREEN_WIDTH
      }
    >
      <SegmentedHeader />
      <Flex
        borderRight={"1px solid var(--ads-v2-color-border)"}
        flex={"1"}
        width={DEFAULT_EDITOR_PANE_WIDTH + "px"}
      >
        <Switch>
          {editorMode === EditorViewMode.FullScreen && (
            <SentryRoute
              component={ListQuery}
              path={querySegmentRoutes.map((route) => `${path}${route}`)}
            />
          )}
          {editorMode === EditorViewMode.FullScreen && (
            <SentryRoute
              component={ListJSObjects}
              path={jsSegmentRoutes.map((route) => `${path}${route}`)}
            />
          )}
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
    </Flex>
  );
};
