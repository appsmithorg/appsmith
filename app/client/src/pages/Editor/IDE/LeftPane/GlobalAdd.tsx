import WidgetSidebarWithTags from "pages/Editor/WidgetSidebarWithTags";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Divider, Icon, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";
import { queryAddURL } from "@appsmith/RouteBuilder";
import { createNewJSCollection } from "../../../../actions/jsPaneActions";
import { WidgetDragSource } from "../../../../layoutSystems/common/canvasArenas/ArenaTypes";

const PaneContainer = styled.div`
  width: 256px;
`;
const PaneBody = styled.div`
  height: calc(100vh - 235px);
  overflow-y: scroll;
  gap: 12px;
`;
const CreateNewContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 8px;
`;
const CTAContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-start;
`;
const CTABox = styled.div`
  height: 80px;
  width: 110px;
  padding: 12px 12px 8px 12px;
  border-radius: 4px;
  gap: 8px;
  border: 1px solid var(--ads-v2-color-border);
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const CreateCTA = (props: {
  title: string;
  icon: string;
  onClick: () => void;
}) => {
  return (
    <CTABox onClick={props.onClick}>
      <Icon name={props.icon} size="lg" />
      <Text>{props.title}</Text>
    </CTABox>
  );
};

const GlobalAdd = () => {
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();
  const onCreateNewQuery = useCallback(() => {
    history.push(queryAddURL({ pageId }));
  }, [pageId]);
  const onCreateJS = useCallback(() => {
    dispatch(createNewJSCollection(pageId, "ADD_PANE"));
  }, [pageId]);
  return (
    <PaneContainer>
      <CreateNewContainer>
        <Text kind="heading-s">Create new..</Text>
        <CTAContainer>
          <CreateCTA
            icon={"queries-line"}
            onClick={onCreateNewQuery}
            title={"Query/API"}
          />
          <CreateCTA
            icon={"js-toggle-v2"}
            onClick={onCreateJS}
            title={"JS Object"}
          />
        </CTAContainer>
      </CreateNewContainer>
      <Divider />
      <PaneBody>
        <Text className="pl-3.5" kind="heading-s">
          Drag & drop widgets
        </Text>
        <WidgetSidebarWithTags isActive source={WidgetDragSource.GLOBAL_ADD} />
      </PaneBody>
    </PaneContainer>
  );
};

export default GlobalAdd;
