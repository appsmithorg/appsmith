import WidgetSidebarWithTags from "pages/Editor/WidgetSidebarWithTags";
import React, { useCallback } from "react";
import styled from "styled-components";
import { Icon, Text } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import history from "utils/history";
import { queryAddURL } from "@appsmith/RouteBuilder";
import { createNewJSCollection } from "actions/jsPaneActions";

const PaneContainer = styled.div`
  width: 256px;
`;
const PaneBody = styled.div`
  height: calc(100vh - 340px);
  overflow-y: scroll;
  gap: 12px;
  padding: var(--ads-v2-spaces-3);
`;
const CreateNewContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-3);
  gap: 8px;
  border-bottom: 1px solid var(--ads-v2-color-border);
`;
const CTAContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-start;
`;
const CTABox = styled.div`
  height: 62px;
  width: 100%;
  padding: var(--ads-v2-spaces-3);
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
      <Icon name={props.icon} size="md" />
      <Text kind="body-s">{props.title}</Text>
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
        <Text kind="heading-xs">Create new..</Text>
        <CTAContainer>
          <CreateCTA
            icon={"queries-line"}
            onClick={onCreateNewQuery}
            title={"Query/API"}
          />
          <CreateCTA
            icon={"braces-line"}
            onClick={onCreateJS}
            title={"JS Object"}
          />
        </CTAContainer>
      </CreateNewContainer>
      <PaneBody>
        <Text className="pl-3.5" kind="heading-xs">
          Drag & drop widgets
        </Text>
        <WidgetSidebarWithTags isActive />
      </PaneBody>
    </PaneContainer>
  );
};

export default GlobalAdd;
