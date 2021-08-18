import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getWidgetCards,
} from "selectors/editorSelectors";
import { getColorWithOpacity } from "constants/DefaultTheme";
import { IPanelProps, Icon, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import ExplorerSearch from "./Explorer/ExplorerSearch";
import { debounce } from "lodash";
import produce from "immer";
import { createMessage, WIDGET_SIDEBAR_CAPTION } from "constants/messages";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import {
  getCurrentStep,
  getCurrentSubStep,
  inOnboarding,
} from "sagas/OnboardingSagas";
import { BUILDER_PAGE_URL } from "constants/routes";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { useLocation } from "react-router";

const MainWrapper = styled.div`
  text-transform: capitalize;
  padding: 10px 10px 20px 10px;
  height: 100%;
  overflow-y: auto;

  scrollbar-color: ${(props) => props.theme.colors.paneCard}
    ${(props) => props.theme.colors.paneBG};
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px
      ${(props) => getColorWithOpacity(props.theme.colors.paneBG, 0.3)};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.paneCard};
    outline: 1px solid ${(props) => props.theme.paneText};
    border-radius: ${(props) => props.theme.radii[1]}px;
  }
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${(props) => props.theme.spaces[1]}px;
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

function WidgetSidebar(props: IPanelProps) {
  const location = useLocation();
  const cards = useSelector(getWidgetCards);
  const [filteredCards, setFilteredCards] = useState(cards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const filterCards = (keyword: string) => {
    let filteredCards = cards;
    if (keyword.trim().length > 0) {
      filteredCards = produce(cards, (draft) => {
        cards.forEach((card, index) => {
          if (card.displayName.toLowerCase().indexOf(keyword) === -1) {
            delete draft[index];
          }
        });
      });
    }
    setFilteredCards(filteredCards);
  };
  const clearSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    filterCards("");
  };

  // For onboarding
  const isInOnboarding = useSelector(inOnboarding);
  const currentStep = useSelector(getCurrentStep);
  const currentSubStep = useSelector(getCurrentSubStep);
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const onCanvas =
    BUILDER_PAGE_URL(applicationId, pageId) === window.location.pathname;
  useEffect(() => {
    if (
      (currentStep === OnboardingStep.DEPLOY || !isInOnboarding) &&
      !onCanvas
    ) {
      props.closePanel();
    }
  }, [currentStep, onCanvas, isInOnboarding, location]);

  const search = debounce((e: any) => {
    filterCards(e.target.value.toLowerCase());
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

  const showTableWidget = currentStep >= OnboardingStep.RUN_QUERY_SUCCESS;
  const showInputWidget = currentStep >= OnboardingStep.ADD_INPUT_WIDGET;

  return (
    <>
      <Boxed step={OnboardingStep.DEPLOY}>
        <ExplorerSearch
          autoFocus
          clear={clearSearchInput}
          placeholder="Search widgets..."
          ref={searchInputRef}
        />
      </Boxed>

      <MainWrapper>
        <Header>
          <Info>
            <p>{createMessage(WIDGET_SIDEBAR_CAPTION)}</p>
          </Info>
          <CloseIcon
            className="t--close-widgets-sidebar"
            color={Colors.WHITE}
            icon="cross"
            iconSize={16}
            onClick={props.closePanel}
          />
        </Header>
        <CardsWrapper>
          {filteredCards.map((card) => (
            <Boxed
              key={card.key}
              show={
                (card.type === "TABLE_WIDGET" && showTableWidget) ||
                (card.type === "INPUT_WIDGET" && showInputWidget)
              }
              step={OnboardingStep.DEPLOY}
            >
              <OnboardingIndicator
                className="onboarding-widget-menu"
                hasButton={false}
                show={
                  (card.type === "TABLE_WIDGET" &&
                    currentStep === OnboardingStep.RUN_QUERY_SUCCESS) ||
                  (card.type === "INPUT_WIDGET" &&
                    currentSubStep === 0 &&
                    currentStep === OnboardingStep.ADD_INPUT_WIDGET)
                }
                step={
                  OnboardingStep.RUN_QUERY_SUCCESS ||
                  OnboardingStep.ADD_INPUT_WIDGET
                }
                width={100}
              >
                <WidgetCard details={card} />
              </OnboardingIndicator>
            </Boxed>
          ))}
        </CardsWrapper>
      </MainWrapper>
    </>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
