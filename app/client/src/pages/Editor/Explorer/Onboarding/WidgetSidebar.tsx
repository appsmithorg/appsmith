import React from "react";
import {
  MainWrapper,
  Header,
  Info,
  CloseIcon,
  CardsWrapper,
} from "pages/Editor/WidgetSidebar";
import WidgetCard from "pages/Editor/WidgetCard";
import { Colors, IPanelProps } from "@blueprintjs/core";
import { WIDGET_SIDEBAR_CAPTION } from "constants/messages";
import { useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import styled from "styled-components";

const StyledMainWrapper = styled(MainWrapper)`
  padding-top: 25px;
`;

const OnboardingWidgetSidebar = (props: IPanelProps) => {
  const cards = useSelector(getWidgetCards);

  let tableCard: any;
  Object.keys(cards).map(group => {
    const tempTableCard = cards[group].find(
      widget => widget.type === "TABLE_WIDGET",
    );

    if (tempTableCard) {
      tableCard = tempTableCard;
    }
  });

  return (
    <StyledMainWrapper>
      <Header>
        <Info>
          <p>{WIDGET_SIDEBAR_CAPTION}</p>
        </Info>
        <CloseIcon
          className="t--close-widgets-sidebar"
          icon="cross"
          iconSize={16}
          color={Colors.WHITE}
          onClick={props.closePanel}
        />
      </Header>

      <CardsWrapper>
        <WidgetCard details={tableCard} />
      </CardsWrapper>
    </StyledMainWrapper>
  );
};

export default OnboardingWidgetSidebar;
