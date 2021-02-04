import React from "react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-dom";
import "instantsearch.css/themes/algolia.css";
import { getAppsmithConfigs } from "configs";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

type SearchProps = {
  query: string;
  children: React.ReactNode;
};

const Search = ({ query, children }: SearchProps) => {
  return (
    <InstantSearch
      searchState={{ query }}
      indexName={algolia.indexName}
      searchClient={searchClient}
    >
      {children}
    </InstantSearch>
  );
};

export default Search;
