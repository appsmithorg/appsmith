import React, { useState, useEffect, useRef, useCallback } from "react";
import { ClearRefinements, RefinementList } from "react-instantsearch-dom";
import styled from "styled-components";
import { ReactComponent as FilterIcon } from "assets/icons/menu/filter.svg";
import { ReactComponent as CloseFilterIcon } from "assets/icons/menu/close-filter.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getSnippetFilterLabel } from "./utils";
import { useStore } from "react-redux";

const SnippetsFilterContainer = styled.div<{
  showFilter: boolean;
  snippetsEmpty: boolean;
  hasRefinements: boolean;
}>`
  position: absolute;
  bottom: 20px;
  display: flex;
  width: 220px;
  height: 32px;
  justify-content: center;
  display: ${(props) => (props.snippetsEmpty ? "none" : "flex")};
  button {
    background: ${(props) =>
      !props.hasRefinements
        ? props.theme.colors.globalSearch.snippets.filterBtnBg
        : !props.showFilter
        ? "#4b4848"
        : props.theme.colors.globalSearch.snippets.filterBtnBg};
    border-radius: 20px;
    transition: 0.2s width ease;
    width: ${(props) => (props.showFilter ? "32" : "75")}px;
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    color: ${(props) =>
      !props.hasRefinements
        ? props.theme.colors.globalSearch.snippets.filterBtnText
        : !props.showFilter
        ? "white"
        : props.theme.colors.globalSearch.snippets.filterBtnText};
    border: none;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
    height: 100%;
    cursor: pointer;
    position: relative;
    svg {
      path {
        fill: ${(props) =>
          !props.hasRefinements
            ? props.theme.colors.globalSearch.snippets.filterBtnText
            : props.showFilter
            ? props.theme.colors.globalSearch.snippets.filterBtnText
            : "white"};
      }
    }
  }
  .filter-list {
    display: block;
    transition: 0.2s all ease;
    position: absolute;
    width: ${(props) => (props.showFilter ? "185px" : "0")};
    height: ${(props) => (props.showFilter ? "185px" : "0")};
    bottom: 40px;
    background: ${(props) =>
      props.theme.colors.globalSearch.snippets.filterListBackground};
    border: 1px solid rgba(240, 240, 240, 1);
    color: ${(props) => props.theme.colors.globalSearch.snippets.filterBtnText};
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
    [class^="ais-"] {
      font-size: 12px;
    }
    .ais-ClearRefinements {
      display: flex;
      justify-content: center;
      .ais-ClearRefinements-button {
        width: auto;
        border-radius: none;
        box-shadow: unset;
        cursor: pointer;
        color: ${(props) => props.theme.colors.globalSearch.searchInputBorder};
        font-weight: ${(props) => props.theme.fontWeights[2]};
        transition: 0.1s;
        background: ${(props) =>
          props.theme.colors.globalSearch.snippets.filterListBackground};
        &:hover {
          background: ${(props) =>
            props.theme.colors.globalSearch.snippets.filterListBackground};
          font-weight: ${(props) => props.theme.fontWeights[3]};
        }
        &.ais-ClearRefinements-button--disabled {
          font-weight: ${(props) => props.theme.fontWeights[1]};
          &:hover {
            background: ${(props) =>
              props.theme.colors.globalSearch.snippets.filterListBackground};
            cursor: block;
          }
        }
      }
    }
    .container {
      height: calc(100% - 25px);
      overflow: auto;
      padding: ${(props) => (props.showFilter ? "7px 15px" : "0")};
      .ais-RefinementList-list {
        text-align: left;
        .ais-RefinementList-item {
          font-size: 12px;
          padding: ${(props) => props.theme.spaces[2]}px 0;
          & > :hover {
            cursor: pointer;
          }
          .ais-RefinementList-label {
            display: flex;
            align-items: center;
            .ais-RefinementList-checkbox {
              height: 15px;
              width: 15px;
            }
            .ais-RefinementList-labelText {
              margin: 0 ${(props) => props.theme.spaces[4]}px;
            }
            .ais-RefinementList-count {
              display: none;
            }
          }
        }
      }
    }
  }
`;

function SnippetsFilter({ refinements, snippetsEmpty }: any) {
  const [showSnippetFilter, toggleSnippetFilter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      // Check if the clicked element has the `ref` element in the path(i.e parent list).
      if (ref && !e.composedPath().includes(ref?.current as EventTarget))
        toggleSnippetFilter(false);
    },
    [showSnippetFilter],
  );
  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  const store = useStore();

  const transformItems = useCallback(
    (items: any) =>
      items.map((item: any) => ({
        ...item,
        label: getSnippetFilterLabel(store.getState(), item.label),
      })),
    [store, getSnippetFilterLabel],
  );

  return (
    <SnippetsFilterContainer
      hasRefinements={refinements.entities && refinements.entities.length > 0}
      ref={ref}
      showFilter={showSnippetFilter}
      snippetsEmpty={snippetsEmpty}
    >
      <button
        className="flex items-center justify-center space-x-1 t--filter-button"
        onClick={() => toggleSnippetFilter(!showSnippetFilter)}
      >
        {!showSnippetFilter && <FilterIcon />}

        {!showSnippetFilter &&
          refinements.entities &&
          refinements.entities &&
          refinements.entities.length > 0 && (
            <span>{refinements.entities.length}</span>
          )}
        {!showSnippetFilter && <span> Filter</span>}
        {showSnippetFilter && <CloseFilterIcon />}
      </button>
      <div className="filter-list t--filter-list">
        <div
          className="container"
          onClick={(e: React.MouseEvent) => {
            AnalyticsUtil.logEvent("SNIPPET_FILTER", {
              filter: (e.target as HTMLSpanElement).textContent,
            });
            e.stopPropagation();
          }}
        >
          <RefinementList
            attribute="entities"
            defaultRefinement={refinements.entities || []}
            transformItems={transformItems}
          />
        </div>
        {showSnippetFilter && (
          <ClearRefinements translations={{ reset: "Reset Filter" }} />
        )}
      </div>
    </SnippetsFilterContainer>
  );
}

export default SnippetsFilter;
