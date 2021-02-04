import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-dom";
import "instantsearch.css/themes/algolia.css";
import { getAppsmithConfigs } from "configs";
import { AppState } from "reducers";

import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";
import ContentView from "./ContentView";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

const StyledContainer = styled.div`
  width: 100%;
  max-width: 660px;
  height: 40vh;
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  & .main {
    display: flex;
    overflow: hidden;
  }
`;

const Search = () => {
  const { query, modalOpen } = useSelector(
    (state: AppState) => state.ui.globalSearch,
  );

  return (
    <InstantSearch
      searchState={{ query }}
      indexName={algolia.indexName}
      searchClient={searchClient}
    >
      <StyledContainer>
        <SearchBox />
        <div className="main">
          <SearchResults />
          <ContentView />
        </div>
      </StyledContainer>
    </InstantSearch>
  );
};

export default Search;
