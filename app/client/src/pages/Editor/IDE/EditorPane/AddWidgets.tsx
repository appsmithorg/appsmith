import React, { useCallback } from "react";
import { Flex, Text, Button } from "design-system";
import { useSelector } from "react-redux";

import history from "utils/history";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import WidgetSidebarWithTags from "pages/Editor/WidgetSidebarWithTags";
import { widgetListURL } from "@appsmith/RouteBuilder";
import { createMessage, PAGES_PANE_TEXTS } from "@appsmith/constants/messages";

const AddWidgets = () => {
  const pageId = useSelector(getCurrentPageId) as string;

  const closeButtonClickHandler = useCallback(() => {
    history.push(widgetListURL({ pageId }));
  }, [pageId]);

  return (
    <>
      <Flex
        alignItems="center"
        borderBottom={"1px solid var(--ads-v2-color-border)"}
        justifyContent="space-between"
        px="spaces-4"
        py="spaces-2"
      >
        <Text
          className="overflow-hidden overflow-ellipsis whitespace-nowrap"
          color="var(--ads-v2-color-fg)"
          kind="heading-xs"
        >
          {createMessage(PAGES_PANE_TEXTS.widgets_create_tab_title)}
        </Text>
        <Button
          isIconButton
          kind={"tertiary"}
          onClick={closeButtonClickHandler}
          size={"sm"}
          startIcon={"close-line"}
        />
      </Flex>
      <Flex flexDirection="column" gap="spaces-3" height="calc(100vh - 310px)">
        <WidgetSidebarWithTags isActive />
      </Flex>
    </>
  );
};

export { AddWidgets };
