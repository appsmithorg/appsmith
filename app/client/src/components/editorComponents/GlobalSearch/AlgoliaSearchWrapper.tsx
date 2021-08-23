import React, { useState, useCallback, useEffect } from "react";
import algoliasearch from "algoliasearch/lite";
import { Configure, InstantSearch } from "react-instantsearch-dom";
import { getAppsmithConfigs } from "configs";
import { debounce } from "lodash";
import { useSelector } from "store";
import { AppState } from "reducers";
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
  const optionalFilterMeta = useSelector(
    (state: AppState) => state.ui.globalSearch.filterContext.fieldMeta,
  );

  useEffect(() => {
    debouncedSetQueryInState(query);
  }, [query]);

  return (
    <InstantSearch
      indexName={isSnippet(category) ? algolia.snippetIndex : algolia.indexName}
      onSearchStateChange={(searchState) => {
        setRefinement(searchState.refinementList || {});
      }}
      searchClient={searchClient}
      searchState={{
        query: queryInState,
        refinementList: refinements,
      }}
    >
      <Configure optionalFilters={getOptionalFilters(optionalFilterMeta)} />
      {children}
    </InstantSearch>
  );
}

export default Search;

function getOptionalFilters(optionalFilterMeta: any) {
  return Object.keys(optionalFilterMeta || {}).map(
    (field) => `${field}:${optionalFilterMeta[field]}`,
  );
}
