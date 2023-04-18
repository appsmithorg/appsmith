import React, { useState, useEffect, useRef, useCallback } from "react";
import { ClearRefinements, RefinementList } from "react-instantsearch-dom";
import styled from "styled-components";
import { ReactComponent as CloseFilterIcon } from "assets/icons/menu/close-filter.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getSnippetFilterLabel } from "./utils";
import { useStore } from "react-redux";
import { Button } from "design-system";

const SnippetsFilterContainer = styled.div<{
  showFilter: boolean;
  snippetsEmpty: boolean;
  hasRefinements: boolean;
}>`
  position: fixed;
  bottom: 20px;
  display: flex;
  width: 220px;
  height: 32px;
  justify-content: center;
  display: ${(props) => (props.snippetsEmpty ? "none" : "flex")};
  .button-filter {
    box-shadow: var(--ads-v2-shadow-popovers);
  }
  .filter-list {
    display: block;
    transition: 0.2s all ease;
    position: absolute;
    width: ${(props) => (props.showFilter ? "185px" : "0")};
    height: ${(props) => (props.showFilter ? "185px" : "0")};
    bottom: 40px;
    background: var(--ads-v2-color-bg);
    border-radius: var(--ads-v2-border-radius);
    border: 1px solid var(--ads-v2-color-border);
    box-shadow: var(--ads-v2-shadow-popovers);
    [class^="ais-"] {
      font-size: 12px;
    }
    .ais-ClearRefinements {
      display: flex;
      justify-content: center;
      .ais-ClearRefinements-button {
        --button-font-weight: 600;
        --button-font-size: 14px;
        --button-padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
        --button-gap: var(--ads-v2-spaces-2);
        --button-color-bg: transparent;
        --button-color-fg: var(--ads-v2-color-fg);
        --button-color-border: transparent;
        --button-font-weight: 600;
        --button-font-size: 14px;
        --button-padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
        --button-gap: var(--ads-v2-spaces-3);
        mix-blend-mode: multiply;

        position: relative;
        cursor: pointer;
        border: none;
        background-color: transparent;
        color: var(--button-color-fg);
        text-decoration: none;
        height: var(--button-height);
        box-sizing: border-box;
        overflow: hidden;
        min-width: min-content;
        border-radius: var(--ads-v2-border-radius) !important;

        display: flex;
        align-self: center;
        gap: var(--button-gap);
        background-color: var(--button-color-bg);
        box-sizing: border-box;
        padding: var(--button-padding);
        border-radius: inherit;
        text-transform: capitalize;
        :hover:not(.ais-ClearRefinements-button--disabled]) {
          --button-color-bg: var(--ads-v2-color-bg-subtle);
          --button-color-fg: var(--ads-v2-color-fg);
        }
        &.ais-ClearRefinements-button--disabled {
          cursor: not-allowed;
          opacity: var(--ads-v2-opacity-disabled);
        }
      }
    }
    .container {
      height: calc(100% - 33px);
      overflow: auto;
      .ais-RefinementList-list {
        text-align: left;
        .ais-RefinementList-item {
          font-size: 12px;
          padding: 7px 15px;
          margin: 1px;
          border-radius: var(--ads-v2-border-radius);
          & > :hover {
            cursor: pointer;
          }
          .ais-RefinementList-label {
            display: flex;
            align-items: center;
            .ais-RefinementList-checkbox {
              height: 16px;
              width: 16px;
            }
            .ais-RefinementList-labelText {
              margin: 0 ${(props) => props.theme.spaces[4]}px;
            }
            .ais-RefinementList-count {
              display: none;
            }
          }
          &.ais-RefinementList-item--selected {
            background-color: var(--ads-v2-color-bg-muted);
          }
          &:hover {
            background-color: var(--ads-v2-color-bg-subtle);
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
      <Button
        className="t--filter-button button-filter"
        kind="secondary"
        onClick={() => toggleSnippetFilter(!showSnippetFilter)}
        startIcon="filter"
      >
        {!showSnippetFilter &&
          refinements.entities &&
          refinements.entities &&
          refinements.entities.length > 0 && (
            <span>{refinements.entities.length}</span>
          )}
        {!showSnippetFilter && <span> Filter</span>}
        {showSnippetFilter && <CloseFilterIcon />}
      </Button>
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
