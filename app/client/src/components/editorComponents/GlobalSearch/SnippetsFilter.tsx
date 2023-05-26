import React, { useState, useEffect, useRef, useCallback } from "react";
import { ClearRefinements, RefinementList } from "react-instantsearch-dom";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getSnippetFilterLabel } from "./utils";
import { useStore } from "react-redux";
import { Button } from "design-system";
import { importSvg } from "design-system-old";

const CloseFilterIcon = importSvg(
  () => import("assets/icons/menu/close-filter.svg"),
);

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
    span + span {
      margin-left: 4px;
    }
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
      font-size: 14px;
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
        &:hover {
          --button-color-bg: var(--ads-v2-color-bg-subtle);
          --button-color-fg: var(--ads-v2-color-fg);
        }
        &.ais-ClearRefinements-button--disabled {
          cursor: not-allowed;
          opacity: var(--ads-v2-opacity-disabled);
          --button-color-bg: transparent;
        }
      }
    }
    .container {
      height: calc(100% - 38px);
      overflow: auto;
      --checkbox-color-label: var(--ads-v2-color-fg);
      --checkbox-color-border: var(--ads-v2-color-border);
      --checkbox-color-background: var(--ads-v2-color-bg);
      --checkbox-color-background-checkmark: var(
        --ads-v2-color-fg-on-brand-secondary
      );
      .ais-RefinementList-checkbox {
        opacity: 0;
        position: absolute;
        left: 0;
      }

      .ais-RefinementList-label {
        cursor: pointer;
        position: relative;
        padding-left: var(--ads-v2-spaces-7);
        font-family: var(--ads-v2-font-family);
        color: var(--checkbox-color-label);
        display: flex;
        align-items: center;
        justify-content: left;
        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 2px;
          width: 16px;
          height: 16px;
          border: 1px solid var(--ads-v2-color-border);
          border-radius: var(--ads-v2-border-radius);
          box-sizing: border-box;
          background-color: var(--checkbox-color-background);
        }

        &::after {
          content: "";
          position: absolute;
          left: 0;
          top: 2px;
          width: 16px;
          height: 16px;
          border-radius: var(--ads-v2-border-radius);
          background-color: var(--ads-v2-color-bg-brand-secondary);
          border: 1px solid var(--ads-v2-color-bg-brand-secondary);
          box-sizing: border-box;
          transform: scale(0);
          transition: transform 0.2s ease;
          z-index: 1;
        }
      }
      .ais-RefinementList-checkbox + span:before {
        content: "";
        opacity: 0;
        position: absolute;
        left: 3px;
        top: 11px;
        width: 5px;
        height: var(--ads-v2-spaces-1);
        border-radius: 4px;
        background-color: var(--checkbox-color-background-checkmark);
        transform: rotateZ(48deg);
        z-index: 2;
      }

      .ais-RefinementList-checkbox + span:after {
        content: "";
        opacity: 0;
        position: absolute;
        left: 4px;
        top: 9px;
        width: 10px;
        height: var(--ads-v2-spaces-1);
        border-radius: 4px;
        background-color: var(--checkbox-color-background-checkmark);
        transform: rotateZ(304deg);
        z-index: 2;
      }

      /* Style for the custom checkbox when it is checked */
      .ais-RefinementList-checkbox:checked + span:before {
        opacity: 1;
      }
      .ais-RefinementList-checkbox:checked + span:after {
        opacity: 1;
      }

      .ais-RefinementList-labelText {
        /* align the label text */
        display: inline-block;
        vertical-align: middle;
      }

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
            .ais-RefinementList-count {
              display: none;
            }
          }
          &.ais-RefinementList-item--selected {
            background-color: var(--ads-v2-color-bg-muted);
            .ais-RefinementList-label {
              &::after {
                transform: scale(1);
              }
            }
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
