import React, { useEffect, useState } from "react";
import { withProfiler } from "@sentry/react";
import { Flex, SegmentedControl } from "design-system";
import { useLocation } from "react-router";
import { FocusEntity } from "navigation/FocusEntity";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";

enum TabsType {
  QUERIES = "queries",
  JS = "js",
  UI = "ui",
}

const _pagesPane = () => {
  const location = useLocation();
  const [selected, setSelected] = useState<TabsType | undefined>(undefined);

  /**
   * useEffect to identify the entity from the path
   *
   */
  useEffect(() => {
    const entity: FocusEntity = identifyEntityFromPath(
      location.pathname,
    ).entity;
    // eslint-disable-next-line no-console
    console.log("entity", entity);
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

  // TODO: Add onClick handlers to the SegmentedControl
  return (
    <Flex
      className="ide-pages-pane"
      flexDirection="row"
      gap="spacing-2"
      height="100%"
      padding="spaces-2"
      width="256px"
    >
      <SegmentedControl
        isFullWidth
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
  );
};

const PagesPane = withProfiler(_pagesPane);

export { PagesPane };
