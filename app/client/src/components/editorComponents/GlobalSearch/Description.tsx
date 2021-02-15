import React from "react";
import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import styled from "styled-components";
import { SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";

type Props = {
  activeItem: any;
  activeItemType?: SEARCH_ITEM_TYPES;
};

const Container = styled.div`
  flex: 1;
  padding: ${(props) => props.theme.spaces[12]}px;

  ${(props) => getTypographyByKey(props, "p1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p1")};
  }
  display: flex;
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
`;

const Description = (props: Props) => {
  const { activeItem, activeItemType } = props;

  return (
    <Container>
      {activeItemType === SEARCH_ITEM_TYPES.documentation ? (
        <AlgoliaHighlight hit={activeItem} attribute="description" />
      ) : null}
    </Container>
  );
};

export default Description;
