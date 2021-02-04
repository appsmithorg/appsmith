import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { useDispatch } from "react-redux";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import { AppState } from "reducers";

const StyledInput = styled.input`
  ${(props) => getTypographyByKey(props, "cardSubheader")}
  background: ${(props) => props.theme.colors.globalSearch.containerBackground};
  color: ${(props) => props.theme.colors.globalSearch.searchInputText};
  border: none;
`;

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.keyCode === 38 || e.key === "ArrowUp") {
    e.preventDefault();
  }
};

const SearchBox = ({ isSearchStalled, refine }: SearchBoxProvided) => {
  const [listenToChange, setListenToChange] = useState(false);
  const dispatch = useDispatch();
  const { query, modalOpen } = useSelector(
    (state: AppState) => state.ui.globalSearch,
  );
  const updateSearchQuery = useCallback(
    (e) => {
      // to prevent key combo to open modal (shift + o) from trigging query update
      if (!listenToChange) return;
      console.log(e.key === "Enter" && e.shiftKey, "isENTER");
      console.log(e.currentTarget.value, "event", e);
      const query = e.currentTarget.value;
      dispatch(setGlobalSearchQuery(query));
    },
    [listenToChange],
  );

  useEffect(() => {
    let timer: number;
    if (modalOpen) {
      timer = setTimeout(() => setListenToChange(true), 100);
    }

    return () => {
      if (timer) clearTimeout(timer);
      setListenToChange(false);
    };
  }, [modalOpen]);

  return (
    <>
      <StyledInput
        value={query}
        onChange={(event) => updateSearchQuery(event)}
        autoFocus
        onKeyDown={handleKeyDown}
      />
      {/* <button onClick={() => refine("")}>Reset query</button>
      {isSearchStalled ? "My search is stalled" : ""} */}
    </>
  );
};

export default connectSearchBox(SearchBox);
