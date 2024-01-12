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
import { useSegmentNavigation } from "pages/Editor/IDE/hooks";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";

const tabsStyle = {
  alignItems: "center",
  borderRadius: "var(--ads-v2-border-radius)",
  className: "hover:bg-[var(--ads-v2-colors-content-surface-hover-bg)]",
  cursor: "pointer",
  flex: "1",
  gap: "spaces-2",
  height: "100%",
  justifyContent: "center",
  width: "100%",
};

const MinimalSegment = () => {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const actionsCount = useSelector(getActionsCount(pageId));
  const jsActionsCount = useSelector((state) =>
    getJsActionsCount(state, pageId),
  );
  const widgetsCount = useSelector((state) => getWidgetsCount(state, pageId));
  const { onSegmentChange } = useSegmentNavigation();

  const onClickHandler = (tab: EditorEntityTab) => {
    dispatch(setIdeEditorPagesActiveStatus(false));
    onSegmentChange(tab);
  };

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
        {...tabsStyle}
        onClick={() => onClickHandler(EditorEntityTab.QUERIES)}
      >
        <Text kind={"body-m"}>
          {createMessage(EDITOR_PANE_TEXTS.queries_tab)}
        </Text>
        <Tag isClosable={false} size="md">
          {actionsCount}
        </Tag>
      </Flex>
      <Flex {...tabsStyle} onClick={() => onClickHandler(EditorEntityTab.JS)}>
        <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.js_tab)}</Text>
        <Tag isClosable={false} size="md">
          {jsActionsCount}
        </Tag>
      </Flex>
      <Flex {...tabsStyle} onClick={() => onClickHandler(EditorEntityTab.UI)}>
        <Text kind={"body-m"}>{createMessage(EDITOR_PANE_TEXTS.ui_tab)}</Text>
        <Tag isClosable={false} size="md">
          {widgetsCount}
        </Tag>
      </Flex>
    </Flex>
  );
};

export { MinimalSegment };
