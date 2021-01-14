import React from "react";
import { useSelector } from "react-redux";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-dom";
import "instantsearch.css/themes/algolia.css";
import { getAppsmithConfigs } from "configs";
import { AppState } from "reducers";

import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

const Search = () => {
  const globalSearchState = useSelector(
    (state: AppState) => state.ui.globalSearch,
  );
  const { query } = globalSearchState;

  return (
    <InstantSearch
      searchState={{ query }}
      indexName={algolia.indexName}
      searchClient={searchClient}
    >
      <SearchBox />
      <SearchResults />
    </InstantSearch>
  );
};

export default Search;
