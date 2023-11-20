import React, { useCallback, useEffect, useState } from "react";
import { withProfiler } from "@sentry/react";
import { Divider, Flex, SegmentedControl } from "design-system";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";

import { FocusEntity } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";
import { QueriesJS } from "./Queries_JS";
import ExplorerWidgetGroup from "pages/Editor/Explorer/Widgets/WidgetGroup";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import {
  builderURL,
  jsCollectionURL,
  queryEditorURL,
} from "@appsmith/RouteBuilder";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import Pages from "pages/Editor/Explorer/Pages";

enum TabsType {
  QUERIES = "queries",
  JS = "js",
  UI = "ui",
}

const _pagesPane = () => {
  const location = useLocation();
  const [selected, setSelected] = useState<TabsType | undefined>(undefined);
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );

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
      case FocusEntity.API:
        setSelected(TabsType.QUERIES);
        break;
      case FocusEntity.JS_OBJECT:
        setSelected(TabsType.JS);
        break;
      case FocusEntity.CANVAS:
      case FocusEntity.NONE:
      case FocusEntity.PROPERTY_PANE:
        setSelected(TabsType.UI);
        break;
    }
  }, [location.pathname]);

  const showWidgetsSidebar = useCallback(() => {
    AnalyticsUtil.logEvent("EXPLORER_WIDGET_CLICK");
    history.push(builderURL({ pageId }));
    dispatch(forceOpenWidgetPanel(true));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch(toggleInOnboardingWidgetSelection(true));
    }
  }, [isFirstTimeUserOnboardingEnabled, pageId]);

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
        history.push(queryEditorURL({ pageId }));
        break;
      case TabsType.JS:
        history.push(jsCollectionURL({ pageId }));
        break;
      case TabsType.UI:
        history.push(builderURL({ pageId }));
        break;
    }
  };
  return (
    <Flex
      border="1px solid var(--ads-v2-color-border)"
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
              startIcon: "queries-line",
              value: TabsType.QUERIES,
            },
            {
              label: createMessage(PAGES_PANE_TEXTS.js_tab),
              startIcon: "braces-line",
              value: TabsType.JS,
            },
            {
              label: createMessage(PAGES_PANE_TEXTS.ui_tab),
              startIcon: "dashboard-line",
              value: TabsType.UI,
            },
          ]}
          value={selected}
        />
      </Flex>
      <Divider />
      <Flex
        className="ide-pages-pane__content"
        flexDirection="column"
        height="100%"
        overflow="hidden"
        width="100%"
      >
        {(selected === TabsType.QUERIES || selected === TabsType.JS) && (
          <QueriesJS paneType={selected} />
        )}

        {selected === TabsType.UI && (
          <ExplorerWidgetGroup
            addWidgetsFn={showWidgetsSidebar}
            searchKeyword=""
            step={0}
          />
        )}
      </Flex>
    </Flex>
  );
};

const PagesPane = withProfiler(_pagesPane);

export { PagesPane };
