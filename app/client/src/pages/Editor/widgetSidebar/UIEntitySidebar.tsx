import {
  WIDGET_PANEL_EMPTY_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";
import type {
  GroupedWidgetCardsWithMaxRenderList,
  WidgetTags,
  WidgetCardWithMaxRenderList,
} from "constants/WidgetConstants";
import {
  WIDGET_TAGS,
  SUGGESTED_WIDGETS_ORDER,
} from "constants/WidgetConstants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  SearchInput,
  Spinner,
  Text,
} from "design-system";
import Fuse from "fuse.js";
import { debounce, sortBy } from "lodash";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { groupWidgetCardsByTags, setWidgetTagMaxRender } from "../utils";
import SeeMoreButton from "./SeeMoreButton";
import WidgetCard from "./WidgetCard";
import { useUIExplorerItems } from "./hooks";
import styled from "styled-components";

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 70px;
  margin-bottom: 70px;
`;

function UIEntitySidebar({ isActive }: { isActive: boolean }) {
  const {
    cards,
    groupedCards,
    groupedCardsWithMaxRenderPerTag,
    isLoadingTemplates,
    showMaxWidgetsPerTag,
    toggleMaxWidgetsPerTag,
  } = useUIExplorerItems();
  const [filteredCards, setFilteredCards] =
    useState<GroupedWidgetCardsWithMaxRenderList>(
      groupedCardsWithMaxRenderPerTag,
    );
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

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
        setWidgetTagMaxRender(
          groupWidgetCardsByTags(
            searchResult.length > 0 ? searchResult : searchWildcards,
          ),
          showMaxWidgetsPerTag,
        ),
      );
      setIsEmpty(searchResult.length === 0);
    } else {
      setFilteredCards(
        setWidgetTagMaxRender(groupedCards, showMaxWidgetsPerTag),
      );
      setIsSearching(false);
      setIsEmpty(false);
    }
  };

  const search = debounce((value: string) => {
    filterCards(value.toLowerCase());
  }, 300);

  useEffect(() => {
    setFilteredCards(setWidgetTagMaxRender(groupedCards, showMaxWidgetsPerTag));
  }, [groupedCardsWithMaxRenderPerTag]);

  return (
    <div
      className={`flex flex-col t--widget-sidebar overflow-hidden ${
        isActive ? "" : "hidden"
      }`}
    >
      <div className="sticky top-0 px-3 mt-0.5">
        <SearchInput
          autoComplete="off"
          id={ENTITY_EXPLORER_SEARCH_ID}
          onChange={search}
          placeholder="Search widgets"
          ref={searchInputRef}
          type="text"
        />
      </div>
      <div
        className="flex-grow px-3 mt-2 overflow-y-scroll"
        data-testid="t--widget-sidebar-scrollable-wrapper"
      >
        {isEmpty && (
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
          {Object.keys(filteredCards).map((tag) => {
            const cardsForThisTag: WidgetCardWithMaxRenderList =
              filteredCards[tag as WidgetTags];

            /* Show loading indicator only for Building Blocks */
            if (isLoadingTemplates && tag === WIDGET_TAGS.BUILDING_BLOCKS) {
              return (
                <LoadingWrapper key={tag}>
                  <CollapsibleHeader arrowPosition="start">
                    <Text
                      className="select-none"
                      color="var(--ads-v2-color-gray-600)"
                      kind="heading-xs"
                    >
                      {tag}
                    </Text>
                  </CollapsibleHeader>
                  <Spinner size={"lg"} />
                </LoadingWrapper>
              );
            }

            if (!cardsForThisTag?.data.length) {
              return null;
            }

            if (
              isSearching &&
              tag === WIDGET_TAGS.SUGGESTED_WIDGETS &&
              !isEmpty
            ) {
              return null;
            }

            return (
              <Collapsible
                className={`pb-2 widget-tag-collapisble widget-tag-collapisble-${tag
                  .toLowerCase()
                  .replace(/ /g, "-")}`}
                isOpen
                key={tag}
              >
                <CollapsibleHeader arrowPosition="start">
                  <Text
                    className="select-none"
                    color="var(--ads-v2-color-gray-600)"
                    kind="heading-xs"
                  >
                    {tag}
                  </Text>
                </CollapsibleHeader>
                <CollapsibleContent>
                  <div className="grid items-stretch grid-cols-3 gap-x-1 gap-y-1 justify-items-stretch">
                    {tag === WIDGET_TAGS.SUGGESTED_WIDGETS
                      ? sortBy(
                          cardsForThisTag.data,
                          (widget) => SUGGESTED_WIDGETS_ORDER[widget.type],
                        ).map((card) => (
                          <WidgetCard details={card} key={card.key} />
                        ))
                      : cardsForThisTag.data.map((card) => (
                          <WidgetCard details={card} key={card.key} />
                        ))}
                  </div>
                  <SeeMoreButton
                    hidden={cardsForThisTag.maxRenderList ? false : true}
                    showSeeLess={!showMaxWidgetsPerTag[tag as WidgetTags]}
                    toggleSeeMore={() =>
                      toggleMaxWidgetsPerTag(tag as WidgetTags)
                    }
                  />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}

UIEntitySidebar.displayName = "UIEntitySidebar";

export default UIEntitySidebar;
