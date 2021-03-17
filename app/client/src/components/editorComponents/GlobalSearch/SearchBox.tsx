import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { getTypographyByKey } from "constants/DefaultTheme";
import Icon from "components/ads/Icon";
import { AppState } from "reducers";
import { createMessage, OMNIBAR_PLACEHOLDER } from "constants/messages";

const Container = styled.div`
  padding: ${(props) => `0 ${props.theme.spaces[11]}px`};
  & input {
    ${(props) => getTypographyByKey(props, "cardSubheader")}
    background: transparent;
    color: ${(props) => props.theme.colors.globalSearch.searchInputText};
    border: none;
    padding: ${(props) => `${props.theme.spaces[7]}px 0`};
    flex: 1;
  }
`;

const InputContainer = styled.div`
  display: flex;
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

const useListenToChange = (modalOpen: boolean) => {
  const [listenToChange, setListenToChange] = useState(false);

  useEffect(() => {
    setListenToChange(false);
    let timer: number;
    if (modalOpen) {
      timer = setTimeout(() => setListenToChange(true), 100);
    }
    return () => clearTimeout(timer);
  }, [modalOpen]);

  return listenToChange;
};

const SearchBox = ({ query, setQuery }: SearchBoxProps) => {
  const { modalOpen } = useSelector((state: AppState) => state.ui.globalSearch);
  const listenToChange = useListenToChange(modalOpen);

  const updateSearchQuery = useCallback(
    (query) => {
      // to prevent key combo to open modal from trigging query update
      if (!listenToChange) return;
      setQuery(query);
    },
    [listenToChange],
  );

  return (
    <Container>
      <InputContainer>
        <input
          value={query}
          onChange={(e) => updateSearchQuery(e.currentTarget.value)}
          autoFocus
          onKeyDown={handleKeyDown}
          placeholder={createMessage(OMNIBAR_PLACEHOLDER)}
          className="t--global-search-input"
        />
        {query && (
          <Icon
            name="close"
            className="t--global-clear-input"
            onClick={() => updateSearchQuery("")}
          />
        )}
      </InputContainer>
    </Container>
  );
};

export default connectSearchBox<SearchBoxProps>(SearchBox);
