import React, { useState, useEffect, useRef, useCallback } from "react";
import { ClearRefinements, RefinementList } from "react-instantsearch-dom";
import styled from "styled-components";
import { ReactComponent as FilterIcon } from "assets/icons/menu/filter.svg";
import { ReactComponent as CloseFilterIcon } from "assets/icons/menu/close-filter.svg";

const SnippetsFilterContainer = styled.div<{ showFilter: boolean }>`
  position: absolute;
  bottom: 10px;
  display: flex;
  width: 100%;
  height: 32px;
  justify-content: center;
  button {
    background: #fafafa;
    border-radius: 20px;
    transition: 0.2s width ease;
    width: ${(props) => (props.showFilter ? "32" : "75")}px;
    font-size: 12px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    color: #716e6e;
    border: none;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
    height: 100%;
    cursor: pointer;
    position: relative;
  }
  .filter-list {
    display: block;
    transition: 0.2s all ease;
    position: absolute;
    width: ${(props) => (props.showFilter ? "185px" : "0")};
    height: ${(props) => (props.showFilter ? "185px" : "0")};
    bottom: 40px;
    background: #fafafa;
    border: 1px solid rgba(240, 240, 240, 1);
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
        color: ${(props) => props.theme.colors.globalSearch.activeCategory};
        font-weight: 500;
        transition: 0.1s;
        background: #fafafa;
        &:hover {
          background: #fafafa;
          font-weight: 700;
        }
        &.ais-ClearRefinements-button--disabled {
          font-weight: 400;
          &:hover {
            background: #fafafa;
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
          padding: 5px 0;
          .ais-RefinementList-label {
            display: flex;
            align-items: center;
            .ais-RefinementList-checkbox {
              height: 15px;
              width: 15px;
            }
            .ais-RefinementList-labelText {
              margin: 0 10px;
              text-transform: capitalize;
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

function SnippetsFilter({ refinements }: any) {
  const [showSnippetFilter, toggleSnippetFilter] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (ref && !ref.current?.contains(e?.target as Node))
        toggleSnippetFilter(false);
    },
    [showSnippetFilter],
  );
  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);
  return (
    <SnippetsFilterContainer ref={ref} showFilter={showSnippetFilter}>
      <button onClick={() => toggleSnippetFilter(!showSnippetFilter)}>
        {!showSnippetFilter && <FilterIcon />}
        {!showSnippetFilter &&
          refinements &&
          refinements.entities &&
          refinements.entities.length > 0 &&
          ` ${refinements.entities.length}`}
        {!showSnippetFilter && " Filter"}
        {showSnippetFilter && <CloseFilterIcon />}
      </button>
      <div className="filter-list">
        <div className="container">
          <RefinementList
            attribute="entities"
            defaultRefinement={refinements ? refinements.entities : []}
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
