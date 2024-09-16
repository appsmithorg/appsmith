import UIEntitySidebar from "pages/Editor/widgetSidebar/UIEntitySidebar";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Button, Flex, Icon, Text } from "@appsmith/ads";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import history from "utils/history";
import { queryAddURL } from "ee/RouteBuilder";
import { createNewJSCollection } from "actions/jsPaneActions";
import PaneHeader from "../LeftPane/PaneHeader";

const CTABox = styled.div`
  height: 62px;
  width: 100%;
  padding: var(--ads-v2-spaces-3);
  border-radius: 4px;
  gap: var(--ads-v2-spaces-3);
  border: 1px solid var(--ads-v2-color-border);
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const CTAIcon = styled.div<{ bgColor: string; color: string }>`
  .ads-v2-icon {
    padding: var(--ads-v2-spaces-2);
    background-color: ${(props) => props.bgColor};
    border-radius: var(--ads-v2-spaces-1);
  }
  svg {
    & path {
      fill: ${(props) => props.color};
    }
  }
`;

const CreateCTA = (props: {
  title: string;
  icon: {
    name: string;
    bgColor: string;
    color: string;
  };
  onClick: () => void;
}) => {
  return (
    <CTABox onClick={props.onClick}>
      <CTAIcon bgColor={props.icon.bgColor} color={props.icon.color}>
        <Icon name={props.icon.name} size="md" />
      </CTAIcon>
      <Text kind="body-s">{props.title}</Text>
    </CTABox>
  );
};

const GlobalAdd = () => {
  const basePageId = useSelector(getCurrentBasePageId);
  const dispatch = useDispatch();
  const onCreateNewQuery = useCallback(() => {
    history.push(queryAddURL({ basePageId }));
  }, [basePageId]);
  const onCreateJS = useCallback(() => {
    dispatch(createNewJSCollection(basePageId, "ADD_PANE"));
  }, [basePageId]);
  return (
    <Flex flexDirection={"column"}>
      <PaneHeader
        rightIcon={
          <Button
            className={"t--close-add-editor-button"}
            isIconButton
            kind="tertiary"
            onClick={() => history.goBack()}
            size="sm"
            startIcon={"close-line"}
          />
        }
        title="Add"
      />
      <Flex
        borderBottom={"1px solid var(--ads-v2-color-border)"}
        flexDirection={"column"}
        gap={"spaces-3"}
        padding={"spaces-3"}
      >
        <Text kind="heading-xs">Create new..</Text>
        <Flex gap={"spaces-3"} justifyContent={"flex-start"}>
          <CreateCTA
            icon={{
              name: "queries-line",
              bgColor: "#DBEAFE",
              color: "#2D6BF4",
            }}
            onClick={onCreateNewQuery}
            title={"Query/API"}
          />
          <CreateCTA
            icon={{
              name: "braces-line",
              bgColor: "#FEF3C7",
              color: "#B47A01",
            }}
            onClick={onCreateJS}
            title={"JS Object"}
          />
        </Flex>
      </Flex>
      <Flex
        display={"flex"}
        flexDirection={"column"}
        height={"calc(100vh - 340px)"}
      >
        <Flex padding="spaces-3">
          <Text kind="heading-xs">Drag & drop widgets</Text>
        </Flex>
        <UIEntitySidebar isActive />
      </Flex>
    </Flex>
  );
};

export default GlobalAdd;
