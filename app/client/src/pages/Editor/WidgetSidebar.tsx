import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import { useLocation } from "react-router";

import { createMessage, WIDGET_SIDEBAR_CAPTION } from "constants/messages";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import {
  getCurrentStep,
  getCurrentSubStep,
  inOnboarding,
} from "sagas/OnboardingSagas";
import { AppState } from "reducers";
import { BUILDER_PAGE_URL } from "constants/routes";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import { getExplorerPinned } from "selectors/explorerSelector";
import { setExplorerPinned } from "actions/explorerActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { ReactComponent as PinIcon } from "assets/icons/comments/pin_3.svg";
import { ReactComponent as UnPinIcon } from "assets/icons/comments/unpin.svg";
import { ReactComponent as BackIcon } from "assets/icons/control/back.svg";

const CardsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: ${(props) => props.theme.spaces[1]}px;
  justify-items: stretch;
  align-items: stretch;
`;
function WidgetSidebar(props: IPanelProps) {
  const dispatch = useDispatch();
  const location = useLocation();
  const cards = useSelector(getWidgetCards);
  const pinned = useSelector(getExplorerPinned);
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
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );
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
  const closeWidgetPanel = () => {
    dispatch(forceOpenWidgetPanel(false));
    props.closePanel();
  };

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinned(!pinned));
  }, [pinned, dispatch, setExplorerPinned]);

  return (
    <div className="py-3 space-y-2">
      <Boxed step={OnboardingStep.DEPLOY}>
        <ExplorerSearch
          autoFocus
          clear={clearSearchInput}
          hideClear
          placeholder="Search widgets..."
          ref={searchInputRef}
        />
      </Boxed>

      <p className="px-3 text-xs leading-relaxed text-trueGray-400">
        {createMessage(WIDGET_SIDEBAR_CAPTION)}
      </p>

      <div className="px-3 pt-3">
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
      </div>
    </div>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
