import React from "react"
import WidgetCard from "./WidgetCard"
import styled from "styled-components"
import { IWidgetCardProps } from "../../widgets/BaseWidget"

type WidgetCardPaneProps  = {
  cards: { [id: string]: IWidgetCardProps[]};
}

const CardsPaneWrapper = styled.div`
  width: 300px;
  background-color: ${props => props.theme.colors.paneBG}; 
  border-radius: 5px;
  box-shadow: 0px 0px 3px ${props => props.theme.colors.paneBG};
  padding: 5px 10px;
`;

const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`;

const WidgetCardsPane: React.SFC<WidgetCardPaneProps> = (props: WidgetCardPaneProps) => {
  const groups = Object.keys(props.cards)  
  return (
      <CardsPaneWrapper>
        {
          groups.map((group: string) => 
            <React.Fragment key={group}>
              <h5>{group}</h5>
              <CardsWrapper>
                { props.cards[group].map((card: IWidgetCardProps) => <WidgetCard details={card} key={card.widgetType} />) }
              </CardsWrapper>
            </React.Fragment>
          )
        }
      </CardsPaneWrapper>
    )
}

export default WidgetCardsPane