import React from "react";
import { Flex, Text, Tag } from "design-system";
import { useSelector } from "react-redux";

import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import {
  getActionsCount,
  getJsActionsCount,
  getWidgetsCount,
} from "selectors/ideSelectors";

const MinimalSegment = () => {
  const actionsCount = useSelector(getActionsCount);
  const jsActionsCount = useSelector(getJsActionsCount);
  const widgetsCount = useSelector(getWidgetsCount);

  return (
    <Flex
      alignItems={"center"}
      borderTop={"1px solid var(--ads-v2-color-border)"}
      gap={"spaces-2"}
      height={"36px"}
      justifyContent={"space-between"}
      p={"spaces-2"}
      px={"spaces-3"}
      width={"100%"}
    >
      <Flex
        alignItems={"center"}
        flex={"1"}
        gap={"spaces-2"}
        height={"100%"}
        justifyContent={"center"}
        width={"100%"}
      >
        <Text kind={"body-m"}>
          {createMessage(EDITOR_PANE_TEXTS.queries_tab)}
        </Text>
        <Tag isClosable={false} size="md">
          {actionsCount}
        </Tag>
      </Flex>
      <Flex
        alignItems={"center"}
        flex={"1"}
        gap={"spaces-2"}
        height={"100%"}
        justifyContent={"center"}
        width={"100%"}
      >
        <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.js_tab)}</Text>
        <Tag isClosable={false} size="md">
          {jsActionsCount}
        </Tag>
      </Flex>
      <Flex
        alignItems={"center"}
        flex={"1"}
        gap={"spaces-2"}
        height={"100%"}
        justifyContent={"center"}
        width={"100%"}
      >
        <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.ui_tab)}</Text>
        <Tag isClosable={false} size="md">
          {widgetsCount}
        </Tag>
      </Flex>
    </Flex>
  );
};

export { MinimalSegment };
