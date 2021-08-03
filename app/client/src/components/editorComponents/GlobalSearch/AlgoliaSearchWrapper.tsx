import React, { useState, useCallback, useEffect } from "react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-dom";
import { getAppsmithConfigs } from "configs";
import { debounce } from "lodash";

const { algolia } = getAppsmithConfigs();
const searchClient = algoliasearch(
  "I2XJYY5QVP",
  "103cb223a186e8ce28e6fffea5ac459f",
);

type SearchProps = {
  query: string;
  children: React.ReactNode;
};

function Search({ children, query }: SearchProps) {
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
      indexName="js_snippets"
      searchClient={searchClient}
      searchState={{ query: queryInState }}
    >
      {children}
    </InstantSearch>
  );
}

export default Search;
