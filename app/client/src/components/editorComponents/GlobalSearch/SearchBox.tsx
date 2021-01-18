import React, { useCallback } from "react";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { useDispatch } from "react-redux";
import { setGlobalSearchQuery } from "actions/globalSearchActions";

const SearchBox = ({
  currentRefinement,
  isSearchStalled,
  refine,
}: SearchBoxProvided) => {
  const dispatch = useDispatch();
  const updateSearchQuery = useCallback((query) => {
    dispatch(setGlobalSearchQuery(query));
  }, []);

  return (
    <>
      <input
        type="search"
        value={currentRefinement}
        onChange={(event) => updateSearchQuery(event.currentTarget.value)}
      />
      <button onClick={() => refine("")}>Reset query</button>
      {isSearchStalled ? "My search is stalled" : ""}
    </>
  );
};

export default connectSearchBox(SearchBox);
