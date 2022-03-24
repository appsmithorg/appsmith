import React, { useState, useCallback, useEffect } from "react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-dom";
import { getAppsmithConfigs } from "@appsmith/configs";
import { debounce } from "lodash";
import { isSnippet, SearchCategory } from "./utils";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(algolia.apiId, algolia.apiKey);

type SearchProps = {
  query: string;
  children: React.ReactNode;
  setRefinement: (args: any) => void;
  refinements: any;
  category: SearchCategory;
};

function Search({
  category,
  children,
  query,
  refinements,
  setRefinement,
}: SearchProps) {
  const [queryInState, setQueryInState] = useState(query);
  const debouncedSetQueryInState = useCallback(
    debounce(setQueryInState, 100),
    [],
  );

  useEffect(() => {
    debouncedSetQueryInState(query);
  }, [query]);

  return (
    <InstantSearch
      indexName={isSnippet(category) ? "snippet" : algolia.indexName}
      onSearchStateChange={(searchState) => {
        setRefinement(searchState.refinementList || {});
      }}
      searchClient={searchClient}
      searchState={{
        query: queryInState,
        refinementList: refinements,
      }}
    >
      {children}
    </InstantSearch>
  );
}

export default Search;
