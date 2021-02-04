import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { useDispatch } from "react-redux";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import { debounce } from "lodash";

const StyledInput = styled.input`
  ${(props) => getTypographyByKey(props, "cardSubheader")}
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  color: ${(props) => props.theme.colors.globalSearch.searchInputText};
  border: none;
`;

const SearchBox = ({
  currentRefinement,
  isSearchStalled,
  refine,
}: SearchBoxProvided) => {
  const dispatch = useDispatch();
  const updateSearchQuery = useCallback(
    debounce((query) => {
      dispatch(setGlobalSearchQuery(query));
    }, 100),
    [],
  );

  return (
    <>
      <StyledInput
        type="search"
        value={currentRefinement}
        onChange={(event) => updateSearchQuery(event.currentTarget.value)}
        // onChange={(e) => setValue(e.currentTarget.value)}
        autoFocus
      />
      <button onClick={() => refine("")}>Reset query</button>
      {isSearchStalled ? "My search is stalled" : ""}
    </>
  );
};

export default connectSearchBox(SearchBox);
