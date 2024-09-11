import {
  UI_ELEMENT_PANEL_SEARCH_TEXT,
  WIDGET_PANEL_EMPTY_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import type {
  WidgetCardsGroupedByTags,
  WidgetTags,
} from "constants/WidgetConstants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { Flex, SearchInput, Text } from "@appsmith/ads";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { groupWidgetCardsByTags } from "../utils";
import UIEntityTagGroup from "./UIEntityTagGroup";
import { useUIExplorerItems } from "./hooks";

function UIEntitySidebar({
  focusSearchInput,
  isActive,
}: {
  isActive: boolean;
  focusSearchInput?: boolean;
}) {
  const { cards, entityLoading, groupedCards } = useUIExplorerItems();
  const [filteredCards, setFilteredCards] =
    useState<WidgetCardsGroupedByTags>(groupedCards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [areSearchResultsEmpty, setAreSearchResultsEmpty] = useState(false);
  const hideSuggestedWidgets = useMemo(
    () => isSearching && !areSearchResultsEmpty,
    [isSearching, areSearchResultsEmpty],
  );

  const searchWildcards = useMemo(
    () =>
      cards
        .filter((card) => card.isSearchWildcard)
        .map((card) => ({ ...card, tags: [WIDGET_TAGS.SUGGESTED_WIDGETS] })),
    [cards],
  );

  const fuse = useMemo(
    () =>
      new Fuse(cards, {
        keys: [
          { name: "displayName", weight: 0.8 },
          { name: "searchTags", weight: 0.1 },
          { name: "tags", weight: 0.1 },
        ],
        threshold: 0.2,
        distance: 100,
      }),
    [cards],
  );

  const sendWidgetSearchAnalytics = debounce((value: string) => {
    if (value !== "") {
      AnalyticsUtil.logEvent("WIDGET_SEARCH", { value });
    }
  }, 1000);

  const filterCards = (keyword: string) => {
    setIsSearching(true);
    sendWidgetSearchAnalytics(keyword);

    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);

      setFilteredCards(
        groupWidgetCardsByTags(
          searchResult.length > 0 ? searchResult : searchWildcards,
        ),
      );
      setAreSearchResultsEmpty(searchResult.length === 0);
    } else {
      setFilteredCards(groupedCards);
      setIsSearching(false);
      setAreSearchResultsEmpty(false);
    }
  };

  const search = debounce((value: string) => {
    filterCards(value.toLowerCase());
  }, 300);

  // update widgets list after building blocks have been fetched async
  useEffect(() => {
    setFilteredCards(groupedCards);
  }, [entityLoading[WIDGET_TAGS.BUILDING_BLOCKS]]);

  useEffect(() => {
    if (focusSearchInput) searchInputRef.current?.focus();
  }, [focusSearchInput]);

  return (
    <div
      className={`flex flex-col t--widget-sidebar overflow-hidden ${
        isActive ? "" : "hidden"
      }`}
    >
      <div className="sticky top-0 px-3 mt-0.5">
        <SearchInput
          // @ts-expect-error fix this the next time the file is edited
          autoComplete="off"
          id={ENTITY_EXPLORER_SEARCH_ID}
          onChange={search}
          placeholder={createMessage(UI_ELEMENT_PANEL_SEARCH_TEXT)}
          ref={searchInputRef}
          type="text"
        />
      </div>
      <Flex
        className="flex-grow px-3 overflow-y-scroll flex-col"
        data-testid="t--widget-sidebar-scrollable-wrapper"
        pt="spaces-2"
      >
        {areSearchResultsEmpty && (
          <Text
            color="#6A7585"
            kind="body-m"
            renderAs="p"
            style={{ marginBottom: "15px" }}
          >
            {createMessage(WIDGET_PANEL_EMPTY_MESSAGE)} `
            {searchInputRef.current?.value}`
          </Text>
        )}
        <div>
          {Object.entries(filteredCards).map(([tag, cardsForThisTag]) => {
            if (!cardsForThisTag?.length && !entityLoading[tag as WidgetTags]) {
              return null;
            }

            if (tag === WIDGET_TAGS.SUGGESTED_WIDGETS && hideSuggestedWidgets) {
              return null;
            }

            return (
              <UIEntityTagGroup
                cards={cardsForThisTag}
                isLoading={!!entityLoading[tag as WidgetTags]}
                key={tag}
                tag={tag}
              />
            );
          })}
        </div>
      </Flex>
    </div>
  );
}

UIEntitySidebar.displayName = "UIEntitySidebar";

export default UIEntitySidebar;
