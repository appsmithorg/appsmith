import React, { Component } from "react"
import WidgetCard from "./WidgetCard"
import styled from "styled-components"
import { IWidgetCardProps } from "../../widgets/BaseWidget"

interface WidgetCardPaneProps  {
  cards: { [id: string]: IWidgetCardProps[]}
}

const CardsPaneWrapper = styled.div`
  width: 300px;
  background-color: #fff; 
  border-radius: 5px;
  box-shadow: 0px 0px 3px #ccc;
  padding: 5px 10px;
`;

const CardsWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`;

const WidgetCardsPane: React.SFC<WidgetCardPaneProps> = (props) => {
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