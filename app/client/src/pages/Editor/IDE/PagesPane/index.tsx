import React, { useEffect, useState } from "react";
import { withProfiler } from "@sentry/react";
import { Flex, SegmentedControl } from "design-system";
import { Switch, useLocation, useRouteMatch } from "react-router";
import { useSelector } from "react-redux";

import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history from "utils/history";
import {
  jsCollectionListURL,
  queryListURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import Pages from "pages/Editor/Explorer/Pages";
import { JSSection } from "./JS_Section";
import { QueriesSection } from "./QueriesSection";
import { SentryRoute } from "@appsmith/AppRouter";
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
import { WidgetsSection } from "./WidgetsSection";

enum TabsType {
  QUERIES = "queries",
  JS = "js",
  UI = "ui",
}

const _pagesPane = () => {
  const location = useLocation();
  const [selected, setSelected] = useState<TabsType | undefined>(undefined);
  const pageId = useSelector(getCurrentPageId);
  const { path } = useRouteMatch();

  /**
   * useEffect to identify the entity from the path
   *
   */
  useEffect(() => {
    const entity: FocusEntity = identifyEntityFromPath(
      location.pathname,
    ).entity;
    switch (entity) {
      case FocusEntity.QUERY:
      case FocusEntity.QUERY_LIST:
      case FocusEntity.QUERY_ADD:
      case FocusEntity.API:
        setSelected(TabsType.QUERIES);
        break;
      case FocusEntity.JS_OBJECT:
      case FocusEntity.JS_OBJECT_LIST:
        setSelected(TabsType.JS);
        break;
      case FocusEntity.CANVAS:
      case FocusEntity.NONE:
      case FocusEntity.PROPERTY_PANE:
      case FocusEntity.WIDGET_LIST:
        setSelected(TabsType.UI);
        break;
    }
  }, [location.pathname]);

  /**
   * Callback to handle the segment change
   *
   * @param value
   * @returns
   *
   */
  const onSegmentChange = (value: string) => {
    switch (value) {
      case TabsType.QUERIES:
        history.push(queryListURL({ pageId }));
        break;
      case TabsType.JS:
        history.push(jsCollectionListURL({ pageId }));
        break;
      case TabsType.UI:
        history.push(widgetListURL({ pageId }));
        break;
    }
  };
  return (
    <Flex
      className="ide-pages-pane"
      flexDirection="column"
      gap="spacing-2"
      height="100%"
      width="256px"
    >
      <Pages />
      {/* divider is inside the Pages component */}
      <Flex
        alignItems="center"
        backgroundColor="var(--ads-v2-colors-control-track-default-bg)"
        className="ide-pages-pane__header"
        justifyContent="space-between"
        padding="spaces-2"
      >
        <SegmentedControl
          isFullWidth
          onChange={onSegmentChange}
          options={[
            {
              label: createMessage(PAGES_PANE_TEXTS.queries_tab),
              value: TabsType.QUERIES,
            },
            {
              label: createMessage(PAGES_PANE_TEXTS.js_tab),
              value: TabsType.JS,
            },
            {
              label: createMessage(PAGES_PANE_TEXTS.ui_tab),
              value: TabsType.UI,
            },
          ]}
          value={selected}
        />
      </Flex>
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

const PagesPane = withProfiler(_pagesPane);

export { PagesPane };
