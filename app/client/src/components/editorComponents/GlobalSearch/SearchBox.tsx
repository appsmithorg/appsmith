import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { getTypographyByKey } from "constants/DefaultTheme";
import { AppState } from "reducers";

const Separator = styled.div`
  height: 1px;
  background: ${(props) => props.theme.colors.globalSearch.separator};
  width: 100%;
`;

const Container = styled.div`
  padding: ${(props) => `0 ${props.theme.spaces[11]}px`};
  & input {
    ${(props) => getTypographyByKey(props, "cardSubheader")}
    background: transparent;
    color: ${(props) => props.theme.colors.globalSearch.searchInputText};
    border: none;
    padding: ${(props) => `${props.theme.spaces[7]}px 0`};
  }
`;

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.keyCode === 38 || e.key === "ArrowUp") {
    e.preventDefault();
  }
};

type SearchBoxProps = SearchBoxProvided & {
  query: string;
  setQuery: (query: string) => void;
};

const SearchBox = ({ query, setQuery }: SearchBoxProps) => {
  const [listenToChange, setListenToChange] = useState(false);
  const { modalOpen } = useSelector((state: AppState) => state.ui.globalSearch);
  const updateSearchQuery = useCallback(
    (e) => {
      // to prevent key combo to open modal (shift + o) from trigging query update
      if (!listenToChange) return;
      const query = e.currentTarget.value;
      setQuery(query);
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
    <Container>
      <input
        value={query}
        onChange={(event) => updateSearchQuery(event)}
        autoFocus
        onKeyDown={handleKeyDown}
      />
      <Separator />
      {/* <button onClick={() => refine("")}>Reset query</button>
      {isSearchStalled ? "My search is stalled" : ""} */}
    </Container>
  );
};

export default connectSearchBox<SearchBoxProps>(SearchBox);
