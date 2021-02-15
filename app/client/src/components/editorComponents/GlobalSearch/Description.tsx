import React from "react";
// import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import styled from "styled-components";
import { SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import ReactMarkdown from "react-markdown";

type Props = {
  activeItem: any;
  activeItemType?: SEARCH_ITEM_TYPES;
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[12]}px;
  ${(props) => getTypographyByKey(props, "p1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p1")};
  }
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  border-radius: ${(props) => props.theme.radii[2]}px;
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background: unset;
    color: ${(props) => props.theme.colors.globalSearch.searchItemHighlight};
    font-style: normal;
    text-decoration: underline;
    text-decoration-color: ${(props) =>
      props.theme.colors.globalSearch.highlightedTextUnderline};
  }
  overflow: auto;
  & * {
    max-width: 100%;
    white-space: pre-wrap;
  }
`;

const Description = (props: Props) => {
  const { activeItem, activeItemType } = props;

  return (
    <Container>
      {activeItemType === SEARCH_ITEM_TYPES.documentation ? (
        <ReactMarkdown>{activeItem.document}</ReactMarkdown>
      ) : null}
    </Container>
  );
};

export default Description;
