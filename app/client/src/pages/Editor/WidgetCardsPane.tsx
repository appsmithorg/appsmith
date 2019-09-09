import React from "react";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import { WidgetCardProps } from "../../widgets/BaseWidget";

type WidgetCardPaneProps = {
  cards: { [id: string]: WidgetCardProps[] };
};

const CardsPaneWrapper = styled.div`
  background-color: ${props => props.theme.colors.paneBG};
  border-radius: ${props => props.theme.radii[2]}px;
  box-shadow: 0px 0px 3px ${props => props.theme.colors.paneBG};
  padding: 5px 10px;
  color: ${props => props.theme.colors.textOnDarkBG};
  text-transform: capitalize;
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${props => props.theme.spaces[2]}px;
  justify-items: stretch;
  align-items: stretch;
`;

const WidgetCardsPane: React.SFC<WidgetCardPaneProps> = (
  props: WidgetCardPaneProps,
) => {
  const groups = Object.keys(props.cards);
  return (
    <CardsPaneWrapper>
      {groups.map((group: string) => (
        <React.Fragment key={group}>
          <h5>{group}</h5>
          <CardsWrapper>
            {props.cards[group].map((card: WidgetCardProps) => (
              <WidgetCard details={card} key={card.widgetType} />
            ))}
          </CardsWrapper>
        </React.Fragment>
      ))}
    </CardsPaneWrapper>
  );
};

export default WidgetCardsPane;
