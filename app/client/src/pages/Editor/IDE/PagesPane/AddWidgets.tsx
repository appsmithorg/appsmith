import React, { useCallback } from "react";
import { Flex, Text, Button } from "design-system";
import { useLocation } from "react-router";
import { useSelector } from "react-redux";

import { ADD_PATH } from "constants/routes";
import history from "utils/history";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import WidgetSidebarWithTags from "pages/Editor/WidgetSidebarWithTags";

const AddWidgets = () => {
  const location = useLocation();
  const pageId = useSelector(getCurrentPageId) as string;

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, [pageId]);

  return (
    <>
      <Flex
        alignItems="center"
        borderBottom={"1px solid var(--ads-v2-color-border)"}
        justifyContent="space-between"
        padding="spaces-4"
        paddingBottom="spaces-3"
      >
        <Text
          className="overflow-hidden overflow-ellipsis whitespace-nowrap"
          color="var(--ads-v2-color-fg)"
          kind="heading-xs"
        >
          Create new query/API
        </Text>
        <Button
          isIconButton
          kind={"tertiary"}
          onClick={closeButtonClickHandler}
          size={"sm"}
          startIcon={"close-line"}
        />
      </Flex>
      <Flex flexDirection="column" gap="spaces-3">
        <WidgetSidebarWithTags isActive />
      </Flex>
    </>
  );
};

export { AddWidgets };
