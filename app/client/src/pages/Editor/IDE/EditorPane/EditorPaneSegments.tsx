import React from "react";
import { Flex } from "design-system";
import { Switch, useRouteMatch } from "react-router";
import { SentryRoute } from "@appsmith/AppRouter";
import { QueriesSection } from "./QueriesSection";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  QUERIES_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_BASE_PATH,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "../../SaaSEditor/constants";
import { JSSection } from "./JS_Section";
import { WidgetsSection } from "./WidgetsSection";
import EntityProperties from "pages/Editor/Explorer/Entity/EntityProperties";
import SegmentedHeader from "./components/SegmentedHeader";

const EditorPaneSegments = () => {
  const { path } = useRouteMatch();

  return (
    <Flex flexDirection="column" gap="spacing-2" overflow="hidden">
      <SegmentedHeader />
      <EntityProperties />
      <Flex
        className="ide-pages-pane__content"
        flexDirection="column"
        height="100%"
        overflow="hidden"
        width="100%"
      >
        <Switch>
          <SentryRoute
            component={QueriesSection}
            path={[
              `${path}${CURL_IMPORT_PAGE_PATH}`,
              `${path}${API_EDITOR_ID_PATH}`,
              `${path}${SAAS_EDITOR_API_ID_PATH}`,
              `${path}${QUERIES_EDITOR_BASE_PATH}`,
            ]}
          />
          <SentryRoute
            component={JSSection}
            path={[
              `${path}${JS_COLLECTION_EDITOR_PATH}`,
              `${path}${JS_COLLECTION_ID_PATH}`,
            ]}
          />
          <SentryRoute
            component={WidgetsSection}
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
