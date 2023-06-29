import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import { getWidgetCards } from "selectors/editorSelectors";
import { SearchInput } from "design-system";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import { debounce } from "lodash";
import {
  createMessage,
  WIDGET_SIDEBAR_CAPTION,
} from "@appsmith/constants/messages";
import Fuse from "fuse.js";
import type { WidgetCardProps } from "widgets/BaseWidget";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type {
  WidgetCardsGroupedByTags,
  WidgetTags,
} from "constants/WidgetConstants";
import { groupWidgetCardsByTags } from "./utils";

function WidgetSidebar({ isActive }: { isActive: boolean }) {
  const cards = useSelector(getWidgetCards);
  const groupedCards = useMemo(() => groupWidgetCardsByTags(cards), [cards]);
  const [filteredCards, setFilteredCards] =
    useState<WidgetCardsGroupedByTags>(groupedCards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fuse = useMemo(() => {
    const options = {
      keys: [
        {
          name: "displayName",
          weight: 0.8,
        },
        {
          name: "searchTags",
          weight: 0.1,
        },
        {
          name: "tags",
          weight: 0.1,
        },
      ],
      threshold: 0.2,
      distance: 100,
    };

    return new Fuse(cards, options);
  }, [cards]);

  const sendWidgetSearchAnalytics = debounce((value: string) => {
    if (value !== "") {
      AnalyticsUtil.logEvent("WIDGET_SEARCH", { value });
    }
  }, 1000);

  const filterCards = (keyword: string) => {
    sendWidgetSearchAnalytics(keyword);

    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);
      setFilteredCards(groupWidgetCardsByTags(searchResult));
    } else {
      setFilteredCards(groupedCards);
    }
  };

  useEffect(() => {
    if (isActive) searchInputRef.current?.focus();
  }, [isActive]);

  const search = debounce((value: string) => {
    filterCards(value.toLowerCase());
  }, 300);

  return (
    <div
      className={`flex flex-col  overflow-hidden ${isActive ? "" : "hidden"}`}
    >
      <div className="sticky top-0 px-3 mt-0.5">
        <SearchInput
          autoComplete="off"
          autoFocus
          id={ENTITY_EXPLORER_SEARCH_ID}
          onChange={search}
          placeholder="Search widgets"
          ref={searchInputRef}
          type="text"
        />
      </div>
      <div
        className="flex-grow px-3 mt-3 overflow-y-scroll"
        data-testid="widget-sidebar-scrollable-wrapper"
      >
        <p className="px-3 py-3 text-sm leading-relaxed t--widget-sidebar">
          {createMessage(WIDGET_SIDEBAR_CAPTION)}
        </p>

        <div>
          {Object.keys(filteredCards).map((tag) => {
            const cardsForThisTag: WidgetCardProps[] =
              filteredCards[tag as WidgetTags];

            if (!cardsForThisTag?.length) {
              return null;
            }

            return (
              <div className="pb-3" key={tag}>
                <p className="pl-3 pb-3 text-sm leading-relaxed font-medium">
                  {tag}
                </p>

                <div className="grid items-stretch grid-cols-3 gap-3 justify-items-stretch">
                  {cardsForThisTag.map((card) => (
                    <WidgetCard details={card} key={card.key} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
