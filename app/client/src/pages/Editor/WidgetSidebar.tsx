import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getWidgetCards,
} from "selectors/editorSelectors";
import { IPanelProps } from "@blueprintjs/core";
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
import { AppState } from "reducers";

const MainWrapper = styled.div`
  text-transform: capitalize;
  padding: 10px 10px 20px 10px;
  height: 100%;
  overflow: hidden;

  &:active,
  &:focus,
  &:hover {
    overflow: auto;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
`;

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${(props) => props.theme.spaces[1]}px;
  justify-items: stretch;
  align-items: stretch;
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
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );
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
      ((currentStep === OnboardingStep.DEPLOY || !isInOnboarding) &&
        !onCanvas) ||
      isForceOpenWidgetPanel === false
    ) {
      props.closePanel();
    }
  }, [currentStep, onCanvas, isInOnboarding, location, isForceOpenWidgetPanel]);

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
          hideClear
          placeholder="Search widgets..."
          ref={searchInputRef}
        />
      </Boxed>

      <MainWrapper>
        <Header>
          <Info>
            <p>{createMessage(WIDGET_SIDEBAR_CAPTION)}</p>
          </Info>
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
