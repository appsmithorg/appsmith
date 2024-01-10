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
    <Flex alignItems={"center"} height={"100%"} justifyContent={"center"}>
      <Text
        color={"var(--ads-v2-colors-content-label-inactive-fg)"}
        kind="body-m"
      >
        {createMessage(HEADER_TITLES.EDITOR) + " /"}
      </Text>
      <Flex
        alignItems={"center"}
        className={"hover:bg-[var(--ads-v2-color-bg-subtle)] cursor-pointer"}
        gap={"spaces-1"}
        height={"100%"}
        justifyContent={"center"}
        onClick={onClickHandler}
        px={"spaces-2"}
      >
        <Text isBold kind={"body-m"}>
          {title}
        </Text>
        <Icon name={"arrow-down-s-line"} size={"md"} />
      </Flex>
    </Flex>
  );
};

export { EditorTitle };
