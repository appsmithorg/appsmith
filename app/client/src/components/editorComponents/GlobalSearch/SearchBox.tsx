import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { getTypographyByKey } from "constants/DefaultTheme";
import Icon from "components/ads/Icon";
import { AppState } from "reducers";
import { createMessage, OMNIBAR_PLACEHOLDER } from "constants/messages";
import { SEARCH_CATEGORIES } from ".";
import { ReactComponent as CloseIcon } from "assets/icons/help/close_blue.svg";

const Container = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[7]}px`};
  background: #ffffff;
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
  align-items: center;
  background: #f0f0f0;
  padding: ${(props) => `0 ${props.theme.spaces[6]}px`};
`;

const CategoryDisplay = styled.div`
  color: #6a86ce;
  background: white;
  height: 32px;
  padding: ${(props) => `${props.theme.spaces[3]}px`};
  display: flex;
  align-items: center;
  border: 1px solid #6a86ce;
  margin-right: ${(props) => props.theme.spaces[4]}px;
  ${(props) => getTypographyByKey(props, "categoryBtn")}
  svg {
    cursor: pointer;
    margin-left: ${(props) => `${props.theme.spaces[4]}px`};
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
  category: any;
  setCategory: (category: any) => void;
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

function SearchBox({ category, query, setCategory, setQuery }: SearchBoxProps) {
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
        {category.title && (
          <CategoryDisplay>
            {category.id}
            <CloseIcon
              onClick={() => setCategory({ id: SEARCH_CATEGORIES.INIT })}
            />
          </CategoryDisplay>
        )}
        <input
          autoFocus
          className="t--global-search-input"
          id="global-search"
          onChange={(e) => updateSearchQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (e.key === "Backspace" && !query)
              setCategory({ id: SEARCH_CATEGORIES.INIT });
            setTimeout(() => document.getElementById("global-search")?.focus());
          }}
          placeholder={createMessage(OMNIBAR_PLACEHOLDER)}
          value={query}
        />
        {query && (
          <Icon
            className="t--global-clear-input"
            name="close"
            onClick={() => updateSearchQuery("")}
          />
        )}
      </InputContainer>
    </Container>
  );
}

export default connectSearchBox<SearchBoxProps>(SearchBox);
