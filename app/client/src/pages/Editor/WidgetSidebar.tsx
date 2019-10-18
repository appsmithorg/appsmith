import React from "react";
import { connect } from "react-redux";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import { WidgetCardProps } from "../../widgets/BaseWidget";
import { AppState } from "../../reducers";
import { WidgetSidebarReduxState } from "../../reducers/uiReducers/widgetSidebarReducer";

type WidgetSidebarProps = {
  cards: { [id: string]: WidgetCardProps[] };
};

const MainWrapper = styled.div`
  text-transform: capitalize;
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${props => props.theme.spaces[1]}px;
  justify-items: stretch;
  align-items: stretch;
`;

const WidgetSidebar: React.FC<WidgetSidebarProps> = (
  props: WidgetSidebarProps,
) => {
  const groups = Object.keys(props.cards);
  return (
    <MainWrapper>
      {groups.map((group: string) => (
        <React.Fragment key={group}>
          <h5>{group}</h5>
          <CardsWrapper>
            {props.cards[group].map((card: WidgetCardProps) => (
              <WidgetCard details={card} key={card.key} />
            ))}
          </CardsWrapper>
        </React.Fragment>
      ))}
    </MainWrapper>
  );
};

export default connect(
  (state: AppState): WidgetSidebarReduxState => {
    // TODO(hetu) Should utilise reselect instead
    const cards = state.ui.widgetSidebar.cards;
    const groups: string[] = Object.keys(cards);
    groups.forEach((group: string) => {
      cards[group] = cards[group].map((widget: WidgetCardProps) => {
        const { rows, columns } = state.entities.widgetConfig.config[
          widget.type
        ];
        return { ...widget, rows, columns };
      });
    });
    return { cards };
  },
)(WidgetSidebar);
