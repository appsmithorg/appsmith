import React from "react";
import { connectCurrentRefinements } from "react-instantsearch-dom";
import styled from "styled-components";
import { ReactComponent as CloseIcon } from "assets/icons/help/close_blue.svg";
import { getSnippetFilterLabel } from "./utils";
import { useStore } from "react-redux";

const RefinementListContainer = styled.div`
  background: ${(props) => props.theme.colors.globalSearch.primaryBgColor};
  display: flex;
  padding: 5px 5px 0;
  justify-content: flex-start;
  align-items: center;
  font-size: 12px;
  color: ${(props) => props.theme.colors.globalSearch.secondaryTextColor};
  .pill-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    .refinement-pill {
      display: flex;
      align-items: center;
      margin: 2px 5px 0;
      padding: 5px;
      color: ${(props) => props.theme.colors.globalSearch.primaryTextColor};
      border: 1px solid
        ${(props) => props.theme.colors.globalSearch.primaryBorderColor};
      svg {
        cursor: pointer;
        transition: 0.2s all ease;
        margin-left: ${(props) => props.theme.spaces[4]}px;
        path {
          fill: #4b4848;
        }
        &:hover {
          transform: scale(1.2);
        }
      }
    }
  }
`;

function RefinementPill({ item, refine, state }: any) {
  return (
    <div className="refinement-pill">
      <span>{getSnippetFilterLabel(state, item.label)}</span>
      <CloseIcon
        onClick={(event) => {
          event.preventDefault();
          refine(item.value);
        }}
      />
    </div>
  );
}

function SnippetRefinements({ items, refine }: any) {
  const store = useStore();
  return (
    <RefinementListContainer>
      <span>Showing filtered results: </span>
      <div className="pill-container">
        {(items[0]?.items || []).map((item: any) => (
          <RefinementPill
            item={item}
            key={item.label}
            refine={refine}
            state={store.getState()}
          />
        ))}
      </div>
    </RefinementListContainer>
  );
}

export default connectCurrentRefinements(SnippetRefinements);
