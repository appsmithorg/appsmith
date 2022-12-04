import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { SearchVariant } from "design-system";
import { InputWrapper, SearchInput } from "design-system";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import { getShouldFocusPropertySearch } from "selectors/propertyPaneSelectors";
import { isCurrentFocusOnInput } from "utils/editorContextUtils";

const SearchInputWrapper = styled.div`
  position: sticky;
  top: 44px;
  z-index: 3;
  border: 1px solid ${Colors.GRAY_50};
  :focus-within {
    border-color: var(--appsmith-input-focus-border-color);
  }
`;

const StyledSearchInput = React.memo(styled(SearchInput)`
  ${InputWrapper} {
    background: ${Colors.GRAY_50};
    padding: 0 8px;
    height: 32px;
  }
`);

export function PropertyPaneSearchInput(props: {
  onTextChange: (text: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const shouldFocusSearch = useSelector(getShouldFocusPropertySearch);

  useEffect(() => {
    // Checks if the property pane opened not because of focusing an input inside a widget
    const isActiveFocusNotFromWidgetInput = !isCurrentFocusOnInput();
    if (shouldFocusSearch && isActiveFocusNotFromWidgetInput)
      wrapperRef.current?.focus();
  }, [shouldFocusSearch]);

  const handleInputKeydown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        wrapperRef.current?.focus();
        break;
    }
  }, []);

  const handleWrapperKeydown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        inputRef.current?.focus();
        break;
    }
  }, []);

  useEffect(() => {
    inputRef.current?.addEventListener("keydown", handleInputKeydown);

    return () => {
      inputRef.current?.removeEventListener("keydown", handleInputKeydown);
    };
  }, []);

  return (
    <SearchInputWrapper
      className="t--property-pane-search-input-wrapper"
      onKeyDown={handleWrapperKeydown}
      ref={wrapperRef}
      tabIndex={0}
    >
      <StyledSearchInput
        className="propertyPaneSearch"
        fill
        onChange={props.onTextChange}
        placeholder="Search for controls, labels etc"
        ref={inputRef}
        tabIndex={-1}
        variant={SearchVariant.BACKGROUND}
      />
    </SearchInputWrapper>
  );
}
