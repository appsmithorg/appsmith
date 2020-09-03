import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import { WidgetCardProps } from "widgets/BaseWidget";
import { getWidgetCards } from "selectors/editorSelectors";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { IPanelProps, Icon, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import ExplorerSearch from "./Explorer/ExplorerSearch";
import { debounce } from "lodash";
import produce from "immer";
import { WIDGET_SIDEBAR_CAPTION } from "constants/messages";

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

const CloseIcon = styled(Icon)`
  &&.${Classes.ICON} {
    cursor: pointer;
    display: flex;
    justify-content: center;
    opacity: 0.6;
    &:hover {
      opacity: 1;
    }
  }
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 7fr 1fr;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: space-around;
  text-transform: none;
  h4 {
    margin-top: 0px;
  }
  p {
    opacity: 0.6;
  }
`;

const WidgetSidebar = (props: IPanelProps) => {
  const cards = useSelector(getWidgetCards);
  const [filteredCards, setFilteredCards] = useState(cards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const clearSearchInput = () => {
    if (searchInputRef.current) searchInputRef.current.value = "";
  };
  const search = debounce((e: any) => {
    const keyword = e.target.value.toLowerCase();
    let filteredCards = cards;
    if (keyword.trim().length > 0) {
      filteredCards = produce(cards, draft => {
        for (const [key, value] of Object.entries(cards)) {
          value.forEach((card, index) => {
            if (card.widgetCardName.toLowerCase().indexOf(keyword) === -1) {
              delete draft[key][index];
            }
          });
          draft[key] = draft[key].filter(Boolean);
          if (draft[key].length === 0) {
            delete draft[key];
          }
        }
      });
    }
    setFilteredCards(filteredCards);
  }, 300);
  useEffect(() => {
    const el: HTMLInputElement | null = searchInputRef.current;

    el?.addEventListener("keydown", search);
    el?.addEventListener("cleared", search);
    return () => {
      el?.removeEventListener("keydown", search);
      el?.removeEventListener("cleared", search);
    };
  }, [searchInputRef, search]);
  const groups = Object.keys(filteredCards);
  return (
    <>
      <ExplorerSearch
        ref={searchInputRef}
        clear={clearSearchInput}
        placeholder="Search widgets..."
      />

      <MainWrapper>
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
        {groups.map((group: string) => (
          <React.Fragment key={group}>
            <h5>{group}</h5>
            <CardsWrapper>
              {filteredCards[group].map((card: WidgetCardProps) => (
                <WidgetCard details={card} key={card.key} />
              ))}
            </CardsWrapper>
          </React.Fragment>
        ))}
      </MainWrapper>
    </>
  );
};

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
