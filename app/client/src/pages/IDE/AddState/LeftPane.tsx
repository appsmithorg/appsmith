import { Icon, Text } from "design-system";
import { importSvg } from "design-system-old";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import styled from "styled-components";
import { setIdePageTabState } from "../ideActions";
import { builderURL, datasourcesEditorURL } from "RouteBuilder";
import history, { NavigationMethod } from "utils/history";
import { IDEAppState, PageNavState, TabState } from "../ideReducer";
import { createNewJSCollection } from "actions/jsPaneActions";
import WidgetSidebarWithTags from "pages/Editor/WidgetSidebarWithTags";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/database-2-line.svg"),
);

const QueriesIcon = importSvg(
  () => import("pages/IDE/assets/icons/queries.svg"),
);

const Container = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  p {
    font-size: 30px;
    color: #4c5664;
  }
`;

const NewCard = styled.div`
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 8px;
  cursor: pointer;
  flex: 1;
  display: flex;
  gap: 8px;
  flex-direction: column;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

const AddNewCardWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const IconWrapper = styled.div<{ backgroundColor: string }>`
  display: flex;
  width: 32px;
  height: 32px;
  padding: 4.3px 4.1px 3.7px 3.9px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background-color: ${(props) => props.backgroundColor};
`;

const AddMainEmptyState = () => {
  return (
    <Container>
      <AddNewCards />
      <WidgetPane />
    </Container>
  );
};

const AddNewCards = () => {
  const currentPageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();

  return (
    <AddNewCardWrapper>
      <NewCard
        onClick={() => {
          history.push(datasourcesEditorURL({ pageId: currentPageId }));
        }}
      >
        <IconWrapper backgroundColor={"#ECFDF5"}>
          <DataIcon fill="#059669" height={"24px"} />
        </IconWrapper>
        <Text kind="heading-xs">New Datasource</Text>
      </NewCard>
      <NewCard
        onClick={() => {
          history.push(
            builderURL({
              pageId: currentPageId,
              ideState: IDEAppState.Page,
              suffix: `/${PageNavState.QUERIES}`,
            }),
            {
              invokedBy: NavigationMethod.CommandClick,
            },
          );
          dispatch(setIdePageTabState(TabState.ADD));
        }}
      >
        <IconWrapper backgroundColor={"#EFF6FF"}>
          <QueriesIcon fill="#2D6BF4" />
        </IconWrapper>
        <Text kind="heading-xs">New Query/Api</Text>
      </NewCard>
      <NewCard
        onClick={() => {
          history.push(
            builderURL({
              pageId: currentPageId,
              ideState: IDEAppState.Page,
              suffix: `/${PageNavState.JS}`,
            }),
            {
              invokedBy: NavigationMethod.CommandClick,
            },
          );
          dispatch(createNewJSCollection(currentPageId, "ENTITY_EXPLORER"));
        }}
      >
        <IconWrapper backgroundColor={"transparent"}>
          <Icon name="js-yellow" size="lg" />
        </IconWrapper>
        <Text kind="heading-xs">New JS Object</Text>
      </NewCard>
    </AddNewCardWrapper>
  );
};

const WidgetPane = () => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col mt-6">
      <Text kind="heading-xs">Drag & Drop widgets on the canvas</Text>
      <div className="flex-1 overflow-y-auto">
        <WidgetSidebarWithTags hideSearch isActive />
      </div>
    </div>
  );
};

export default AddMainEmptyState;
