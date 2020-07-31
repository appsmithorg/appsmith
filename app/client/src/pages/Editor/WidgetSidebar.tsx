import React from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import { WidgetCardProps } from "widgets/BaseWidget";
import { getWidgetCards } from "selectors/editorSelectors";
import { getColorWithOpacity } from "constants/DefaultTheme";

type WidgetSidebarProps = {
  cards: { [id: string]: WidgetCardProps[] };
};

const MainWrapper = styled.div`
  text-transform: capitalize;
  padding: 0 10px 20px 10px;
  height: 100%;
  overflow-y: auto;

  scrollbar-color: ${props => props.theme.colors.paneCard}
    ${props => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${props => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.paneCard};
    outline: 1px solid ${props => props.theme.paneText};
    border-radius: ${props => props.theme.radii[1]}px;
  }
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${props => props.theme.spaces[1]}px;
  justify-items: stretch;
  align-items: stretch;
`;

const WidgetSidebar = () => {
  const cards = useSelector(getWidgetCards);
  const groups = Object.keys(cards);
  return (
    <MainWrapper>
      {groups.map((group: string) => (
        <React.Fragment key={group}>
          <h5>{group}</h5>
          <CardsWrapper>
            {cards[group].map((card: WidgetCardProps) => (
              <WidgetCard details={card} key={card.key} />
            ))}
          </CardsWrapper>
        </React.Fragment>
      ))}
    </MainWrapper>
  );
};

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
