import React from "react";
import { Flex, Text, Icon } from "design-system";
import { useDispatch, useSelector } from "react-redux";

import { createMessage, HEADER_TITLES } from "@appsmith/constants/messages";
import { setIdeEditorPagesActiveStatus } from "actions/ideActions";
import { getPagesActiveStatus } from "selectors/ideSelectors";

const EditorTitle = ({ title }: { title: string }) => {
  const dispatch = useDispatch();
  const active = useSelector(getPagesActiveStatus);

  const onClickHandler = () => {
    dispatch(setIdeEditorPagesActiveStatus(!active));
  };

  return (
    <Flex
      alignItems={"center"}
      borderRadius={"var(--ads-v2-border-radius)"}
      className={"hover:bg-[var(--ads-v2-color-bg-subtle)] cursor-pointer"}
      justifyContent={"center"}
      onClick={onClickHandler}
      p={"spaces-2"}
    >
      <Text
        color={"var(--ads-v2-colors-content-label-inactive-fg)"}
        kind="body-m"
      >
        {createMessage(HEADER_TITLES.EDITOR) + " /"}
      </Text>
      <Flex
        alignItems={"center"}
        className={"t--pages-switcher"}
        data-active={active}
        gap={"spaces-1"}
        height={"100%"}
        justifyContent={"center"}
        paddingLeft={"spaces-2"}
      >
        <Text isBold kind={"body-m"}>
          {title}
        </Text>
        <Icon
          name={active ? "arrow-up-s-line" : "arrow-down-s-line"}
          size={"md"}
        />
      </Flex>
    </Flex>
  );
};

export { EditorTitle };
