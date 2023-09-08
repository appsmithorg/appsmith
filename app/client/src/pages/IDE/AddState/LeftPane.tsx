import { Icon, Link, Text } from "design-system";
import { importSvg } from "design-system-old";
import WidgetCard from "pages/Editor/WidgetCard";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId, getWidgetCards } from "selectors/editorSelectors";
import styled from "styled-components";
import { setIdeSidebarWidth } from "../ideActions";
import { pageEntityUrl } from "RouteBuilder";
import history from "utils/history";
import { PageNavState } from "../ideReducer";

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
  flex: 1;
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

const CardList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  grid-template-rows: repeat(3, auto);
  gap: 12px;
  margin-top: 8px;
`;

const DataMainEmptyState = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setIdeSidebarWidth(400));
  }, []);

  return (
    <Container>
      <AddNewCards />
      <WidgetPane />
    </Container>
  );
};

const AddNewCards = () => {
  return (
    <AddNewCardWrapper>
      <NewCard>
        <IconWrapper backgroundColor={"#ECFDF5"}>
          <DataIcon fill="#059669" height={"24px"} />
        </IconWrapper>
        <Text kind="heading-xs">New Datasource</Text>
      </NewCard>
      <NewCard>
        <IconWrapper backgroundColor={"#EFF6FF"}>
          <QueriesIcon fill="#2D6BF4" />
        </IconWrapper>
        <Text kind="heading-xs">New Query/Api</Text>
      </NewCard>
      <NewCard>
        <IconWrapper backgroundColor={"transparent"}>
          <Icon name="js-yellow" size="lg" />
        </IconWrapper>
        <Text kind="heading-xs">New JS Object</Text>
      </NewCard>
    </AddNewCardWrapper>
  );
};

const WidgetPane = () => {
  const cards = useSelector(getWidgetCards);
  const currentPageId = useSelector(getCurrentPageId);

  return (
    <div>
      <div className="flex justify-between mt-6">
        <Text kind="heading-xs">Drag & Drop widgets on the canvas</Text>
        <Link
          onClick={() => {
            history.push(
              pageEntityUrl({ pageId: currentPageId || "" }, PageNavState.UI),
            );
          }}
        >
          View all
        </Link>
      </div>

      <CardList>
        {cards.slice(0, 15).map((card) => {
          return <WidgetCard details={card} key={card.key} />;
        })}
      </CardList>
    </div>
  );
};

export default DataMainEmptyState;
