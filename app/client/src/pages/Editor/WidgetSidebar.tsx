import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import WidgetCard from "./WidgetCard";
import { getWidgetCards } from "selectors/editorSelectors";
import ExplorerSearch from "./Explorer/ExplorerSearch";
import { debounce } from "lodash";
import {
  createMessage,
  WIDGET_SIDEBAR_CAPTION,
} from "@appsmith/constants/messages";
import Fuse from "fuse.js";
import { WidgetCardProps } from "widgets/BaseWidget";
import styled from "styled-components";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";
import classNames from "classnames";

const StyledWrapper = styled.div<{ isMultiPane: boolean; isActive: boolean }>`
  ${(props) =>
    props.isMultiPane
      ? `
  min-width: 185px;
  max-width: 265px;
  height: inherit;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid rgb(228, 228, 231);
`
      : `
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${props.isActive ? "" : "display: none;"}
`}
`;

function WidgetSidebar({ isActive }: { isActive: boolean }) {
  const cards = useSelector(getWidgetCards);
  const [filteredCards, setFilteredCards] = useState(cards);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isMultiPane = useSelector(isMultiPaneActive);

  let fuse: Fuse<WidgetCardProps, Fuse.FuseOptions<WidgetCardProps>>;

  useEffect(() => {
    fuse = new Fuse(cards, {
      keys: [
        {
          name: "displayName",
          weight: 0.9,
        },
        {
          name: "searchTags",
          weight: 0.1,
        },
      ],
      threshold: 0.2,
      distance: 100,
    });
  }, [cards]);

  const filterCards = (keyword: string) => {
    if (keyword.trim().length > 0) {
      const searchResult = fuse.search(keyword);
      setFilteredCards(searchResult as WidgetCardProps[]);
    } else {
      setFilteredCards(cards);
    }
  };

  useEffect(() => {
    if (isActive) searchInputRef.current?.focus();
  }, [isActive]);

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
    <StyledWrapper isActive={isActive} isMultiPane={isMultiPane}>
      <ExplorerSearch
        autoFocus
        clear={clearSearchInput}
        onChange={search}
        placeholder="Search widgets..."
        ref={searchInputRef}
      />
      <div
        className="flex-grow px-3 overflow-y-scroll"
        data-cy="widget-sidebar-scrollable-wrapper"
      >
        <p className="px-3 py-3 text-sm leading-relaxed text-trueGray-400 t--widget-sidebar">
          {createMessage(WIDGET_SIDEBAR_CAPTION)}
        </p>
        <div
          className={classNames({
            "grid items-stretch gap-3 justify-items-stretch grid-cols-3": true,
          })}
        >
          {filteredCards.map((card) => (
            <WidgetCard details={card} key={card.key} />
          ))}
        </div>
      </div>
    </StyledWrapper>
  );
}

WidgetSidebar.displayName = "WidgetSidebar";

export default WidgetSidebar;
