import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { connectSearchBox } from "react-instantsearch-dom";
import { SearchBoxProvided } from "react-instantsearch-core";
import { getTypographyByKey } from "constants/DefaultTheme";
import Icon from "components/ads/Icon";
import { AppState } from "reducers";
import {
  createMessage,
  OMNIBAR_PLACEHOLDER,
  OMNIBAR_PLACEHOLDER_DOC,
  OMNIBAR_PLACEHOLDER_NAV,
  OMNIBAR_PLACEHOLDER_SNIPPETS,
} from "constants/messages";
import { SEARCH_CATEGORY_ID } from "./utils";
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
  background: ${(props) =>
    props.theme.colors.globalSearch.mainContainerBackground};
  padding: ${(props) => `0 ${props.theme.spaces[6]}px`};
`;

const CategoryDisplay = styled.div`
  color: ${(props) => props.theme.colors.globalSearch.activeCategory};
  background: ${(props) => props.theme.colors.globalSearch.searchItemHighlight};
  height: 32px;
  padding: ${(props) => `${props.theme.spaces[3]}px`};
  display: flex;
  align-items: center;
  border: 1px solid ${(props) => props.theme.colors.globalSearch.activeCategory};
  margin-right: ${(props) => props.theme.spaces[4]}px;
  ${(props) => getTypographyByKey(props, "categoryBtn")}
  svg {
    cursor: pointer;
    margin-left: ${(props) => `${props.theme.spaces[4]}px`};
  }
`;

const getPlaceHolder = (categoryId: SEARCH_CATEGORY_ID) => {
  switch (categoryId) {
    case SEARCH_CATEGORY_ID.SNIPPETS:
      return OMNIBAR_PLACEHOLDER_SNIPPETS;
    case SEARCH_CATEGORY_ID.DOCUMENTATION:
      return OMNIBAR_PLACEHOLDER_DOC;
    case SEARCH_CATEGORY_ID.NAVIGATION:
      return OMNIBAR_PLACEHOLDER_NAV;
  }
  return OMNIBAR_PLACEHOLDER;
};

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
              onClick={() => setCategory({ id: SEARCH_CATEGORY_ID.INIT })}
            />
          </CategoryDisplay>
        )}
        <input
          autoComplete="off"
          autoFocus
          className="t--global-search-input"
          id="global-search"
          onChange={(e) => updateSearchQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            handleKeyDown(e);
            if (e.key === "Backspace" && !query)
              setCategory({ id: SEARCH_CATEGORY_ID.INIT });
          }}
          placeholder={createMessage(getPlaceHolder(category.id))}
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
