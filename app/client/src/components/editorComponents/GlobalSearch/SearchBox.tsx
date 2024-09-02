import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import type { AppState } from "ee/reducers";
import {
  createMessage,
  CREATE_NEW_OMNIBAR_PLACEHOLDER,
  OMNIBAR_PLACEHOLDER,
  OMNIBAR_PLACEHOLDER_NAV,
} from "ee/constants/messages";
import type { SearchCategory } from "./utils";
import { isMenu, SEARCH_CATEGORY_ID } from "./utils";
import { Button, Icon } from "@appsmith/ads";

const Container = styled.div`
  background: var(--ads-v2-color-bg);
  position: fixed;
  left: 0;
  right: 0;
  z-index: 100;
  top: 0;
  padding: 24px 24px 15px 24px;
  border-radius: var(--ads-v2-border-radius) var(--ads-v2-border-radius) 0 0;
  & input {
    font-size: 14px;
    line-height: 19px;
    background: transparent;
    color: var(--ads-v2-color-fg);
    border: none;
    padding: ${(props) => `${props.theme.spaces[4]}px 0`};
    flex: 1;
    margin-left: 10px;
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: var(--ads-v2-color-bg);
  padding: ${(props) => `0 ${props.theme.spaces[4]}px`};
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  &:hover,
  &:active,
  &:focus {
    border-color: var(--ads-v2-color-border-emphasis);
  }
`;

const CategoryDisplay = styled.div`
  color: var(--ads-v2-color-fg);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg-subtle);
  height: 27px;
  padding: var(--ads-v2-spaces-3);
  display: flex;
  align-items: center;
  margin-right: var(--ads-v2-spaces-3);

  svg {
    cursor: pointer;
    margin-left: var(--ads-v2-spaces-3);
    transition: 0.2s all ease;
    &:hover {
      fill: var(--ads-v2-color-fg-muted);
    }
  }
`;

const getPlaceHolder = (categoryId: SEARCH_CATEGORY_ID) => {
  switch (categoryId) {
    case SEARCH_CATEGORY_ID.NAVIGATION:
      return OMNIBAR_PLACEHOLDER_NAV;
    case SEARCH_CATEGORY_ID.ACTION_OPERATION:
      return CREATE_NEW_OMNIBAR_PLACEHOLDER;
  }
  return OMNIBAR_PLACEHOLDER;
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.keyCode === 38 || e.key === "ArrowUp") {
    e.preventDefault();
  }
};

interface SearchBoxProps {
  query: string;
  setQuery: (query: string) => void;
  category: SearchCategory;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCategory: (category: any) => void;
}

const useListenToChange = (modalOpen: boolean) => {
  const [listenToChange, setListenToChange] = useState(false);

  useEffect(() => {
    setListenToChange(false);
    let timer: ReturnType<typeof setTimeout>;
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
      // to prevent key combo to open modal from triggering query update
      if (!listenToChange) return;
      setQuery(query);
      (document.querySelector("#global-search") as HTMLInputElement)?.focus();
    },
    [listenToChange, setQuery],
  );

  return (
    <Container>
      <InputContainer>
        {isMenu(category) && <Icon name="search" size="md" />}
        {category.title && (
          <CategoryDisplay className="t--global-search-category">
            {category.id}
            <Icon
              name="close"
              onClick={() => setCategory({ id: SEARCH_CATEGORY_ID.INIT })}
              size="md"
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
          <Button
            className="t--global-clear-input"
            isIconButton
            kind="tertiary"
            onClick={() => updateSearchQuery("")}
            size="sm"
            startIcon="close"
          />
        )}
      </InputContainer>
    </Container>
  );
}

export default React.memo(SearchBox);
