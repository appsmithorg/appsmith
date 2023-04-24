import React from "react";
import { connectCurrentRefinements } from "react-instantsearch-dom";
import styled from "styled-components";
import { getSnippetFilterLabel } from "./utils";
import { useStore } from "react-redux";
import { Icon } from "design-system";

const RefinementListContainer = styled.div`
  background: ${(props) => props.theme.colors.globalSearch.primaryBgColor};
  display: flex;
  padding: 5px 5px 0;
  justify-content: flex-start;
  align-items: center;
  margin-top: 45px;
  .pill-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 4px;
    .refinement-pill {
      color: var(--ads-v2-color-fg);
      border-radius: var(--ads-v2-border-radius);
      background: var(--ads-v2-color-bg-subtle);
      height: 27px;
      padding: var(--ads-v2-spaces-3);
      display: flex;
      align-items: center;
      svg {
        cursor: pointer;
      }
    }
  }
`;

function RefinementPill({ item, refine, state }: any) {
  return (
    <div className="refinement-pill">
      <span>{getSnippetFilterLabel(state, item.label)}</span>
      <Icon
        name="close"
        onClick={(event) => {
          event.preventDefault();
          refine(item.value);
        }}
        size="md"
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
