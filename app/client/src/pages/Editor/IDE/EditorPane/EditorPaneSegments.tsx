import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import {
  API_EDITOR_BASE_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  JS_COLLECTION_EDITOR_PATH,
  QUERIES_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_BASE_PATH,
} from "constants/routes";
import { SAAS_EDITOR_PATH } from "../../SaaSEditor/constants";
import QueriesSegment from "./Query";
import WidgetsSegment from "./UI";
import JSSegment from "./JS";
import SegmentedHeader from "./components/SegmentedHeader";
import EditorTabs from "../EditorTabs/SplitScreenTabs";

const EditorPaneSegments = () => {
  const { path } = useRouteMatch();

  return (
    <Flex flexDirection="column" gap="spacing-2" overflow="hidden">
      <SegmentedHeader />
      <EditorTabs />
      <Flex
        className="ide-editor-left-pane__content"
        flexDirection="column"
        height="100%"
        overflow="hidden"
        width="100%"
      >
        <Switch>
          <SentryRoute
            component={QueriesSegment}
            path={[
              `${path}${CURL_IMPORT_PAGE_PATH}`,
              `${path}${API_EDITOR_BASE_PATH}`,
              `${path}${SAAS_EDITOR_PATH}`,
              `${path}${QUERIES_EDITOR_BASE_PATH}`,
            ]}
          />
          <SentryRoute
            component={JSSegment}
            path={`${path}${JS_COLLECTION_EDITOR_PATH}`}
          />
          <SentryRoute
            component={WidgetsSegment}
            path={[
              BUILDER_PATH_DEPRECATED,
              BUILDER_PATH,
              BUILDER_CUSTOM_PATH,
              `${path}${WIDGETS_EDITOR_BASE_PATH}`,
            ]}
          />
        </Switch>
      </Flex>
    </Flex>
  );
};

export default EditorPaneSegments;
