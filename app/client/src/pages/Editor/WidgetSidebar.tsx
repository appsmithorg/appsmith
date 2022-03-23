import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import { getWidgetCards } from "selectors/editorSelectors";
import { IPanelProps } from "@blueprintjs/core";
import ExplorerSearch from "./Explorer/ExplorerSearch";
import { debounce } from "lodash";
import produce from "immer";
import { useLocation } from "react-router";

import {
  createMessage,
  WIDGET_SIDEBAR_CAPTION,
} from "@appsmith/constants/messages";
import { matchBuilderPath } from "constants/routes";
import { AppState } from "reducers";

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
  const isForceOpenWidgetPanel = useSelector(
    (state: AppState) => state.ui.onBoarding.forceOpenWidgetPanel,
  );

  const onCanvas = matchBuilderPath(window.location.pathname);

  useEffect(() => {
    if (!onCanvas || isForceOpenWidgetPanel === false) {
      props.closePanel();
    }
  }, [onCanvas, location, isForceOpenWidgetPanel]);

  /**
   * filter widgets
   */
  const search = debounce((e: any) => {
    filterCards(e.target.value.toLowerCase());
  }, 300);

  /**
   * clear the search input
   */
  const clearSearchInput = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    filterCards("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <ExplorerSearch
        autoFocus
        clear={clearSearchInput}
        onChange={search}
        placeholder="Search widgets..."
        ref={searchInputRef}
      />
      <div className="flex-grow px-3 overflow-y-scroll">
        <p className="px-3 py-3 text-sm leading-relaxed text-trueGray-400 t--widget-sidebar">
          {createMessage(WIDGET_SIDEBAR_CAPTION)}
        </p>
        <div className="grid items-stretch grid-cols-3 gap-3 justify-items-stretch">
          {filteredCards.map((card) => (
            <WidgetCard details={card} key={card.key} />
          ))}
        </div>
      </div>
    </div>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
