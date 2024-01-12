import React from "react";
import { Flex, Text, Tag } from "design-system";
import { useDispatch, useSelector } from "react-redux";

import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import {
  getActionsCount,
  getJsActionsCount,
  getWidgetsCount,
} from "selectors/ideSelectors";
import { setIdeEditorPagesActiveStatus } from "actions/ideActions";

const MinimalSegment = () => {
  const dispatch = useDispatch();
  const actionsCount = useSelector(getActionsCount);
  const jsActionsCount = useSelector(getJsActionsCount);
  const widgetsCount = useSelector(getWidgetsCount);

  const onClickHandler = () => {
    dispatch(setIdeEditorPagesActiveStatus(false));
  };

  return (
    <Flex
      alignItems={"center"}
      borderTop={"1px solid var(--ads-v2-color-border)"}
      cursor={"pointer"}
      gap={"spaces-2"}
      height={"36px"}
      justifyContent={"space-between"}
      onClick={onClickHandler}
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
