import React from "react";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import { WidgetCardProps } from "widgets/BaseWidget";
import PaneWrapper from "pages/common/PaneWrapper";

type WidgetCardPaneProps = {
  cards?: { [id: string]: WidgetCardProps[] };
};

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${(props) => props.theme.spaces[1]}px;
  justify-items: stretch;
  align-items: stretch;
`;

function WidgetCardsPane(props: WidgetCardPaneProps) {
  if (!props.cards) {
    return null;
  }
  const groups = Object.keys(props.cards);
  return (
    <PaneWrapper>
      {groups.map((group: string) => (
        <React.Fragment key={group}>
          <h5>{group}</h5>
          <CardsWrapper>
            {props.cards &&
              props.cards[group].map((card: WidgetCardProps) => (
                <WidgetCard details={card} key={card.key} />
              ))}
          </CardsWrapper>
        </React.Fragment>
      ))}
    </PaneWrapper>
  );
}

export default WidgetCardsPane;
