import React from "react";
import { connectCurrentRefinements } from "react-instantsearch-dom";
import styled from "styled-components";
import { ReactComponent as CloseIcon } from "assets/icons/help/close_blue.svg";

const RefinementListContainer = styled.div`
  background: white;
  display: flex;
  padding: 0 16px 10px;
  justify-content: flex-start;
  align-items: center;
  font-size: 12px;
  color: #4b4848;
  .pill-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    .refinement-pill {
      margin: 2px 5px 0;
      padding: 5px;
      text-transform: capitalize;
      background: #f0f0f0;
      svg {
        cursor: pointer;
        margin-left: ${(props) => `${props.theme.spaces[4]}px`};
        path {
          fill: #4b4848;
        }
      }
    }˝
  }
`;

function RefinementPill({ item, refine }: any) {
  return (
    <div className="refinement-pill">
      <span>{item.label}</span>
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
  return (
    <RefinementListContainer>
      <span>Showing filtered results: </span>
      <div className="pill-container">
        {(items[0]?.items || []).map((item: any) => (
          <RefinementPill item={item} key={item.label} refine={refine} />
        ))}
      </div>
    </RefinementListContainer>
  );
}

export default connectCurrentRefinements(SnippetRefinements);
