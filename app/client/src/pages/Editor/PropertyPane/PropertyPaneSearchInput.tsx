import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { SearchVariant } from "design-system";
import { InputWrapper, SearchInput } from "design-system";
import { Colors } from "constants/Colors";
// import { useSelector } from "react-redux";
// import {
//   getShouldFocusPanelPropertySearch,
//   getShouldFocusPropertySearch,
// } from "selectors/propertyPaneSelectors";
// import { isCurrentFocusOnInput } from "utils/editorContextUtils";
import { PROPERTY_SEARCH_INPUT_PLACEHOLDER } from "ce/constants/messages";

const SearchInputWrapper = styled.div`
  position: sticky;
  top: 42px;
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
    height: 34px;
  }
`);

type PropertyPaneSearchInputProps = {
  onTextChange: (text: string) => void;
  isPanel?: boolean;
};

export function PropertyPaneSearchInput(props: PropertyPaneSearchInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // TODO(aswathkk): Fix /ClientSideTests/IDE/Canvas_Context_Property_Pane_spec.js and uncomment this
  // const shouldFocusSearch = useSelector(getShouldFocusPropertySearch);
  // const shouldFocusPanelSearch = useSelector(getShouldFocusPanelPropertySearch);

  // useEffect(() => {
  //   // Checks if the property pane opened not because of focusing an input inside a widget
  //   // The same functionality is being used for context preservation. Need to check if we can piggy back on that.
  //   const isActiveFocusNotFromWidgetInput = !isCurrentFocusOnInput();
  //   if (shouldFocusSearch && isActiveFocusNotFromWidgetInput) {
  //     if (!props.isPanel && !shouldFocusPanelSearch) {
  //       setTimeout(() => {
  //         wrapperRef.current?.focus();
  //       });
  //     } else if (props.isPanel && shouldFocusPanelSearch) {
  //       // Layered panels like Column Panel's transition takes 300ms
  //       setTimeout(() => {
  //         wrapperRef.current?.focus();
  //       }, 300);
  //     }
  //   }
  // }, [shouldFocusSearch, shouldFocusPanelSearch, props.isPanel]);

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
        placeholder={PROPERTY_SEARCH_INPUT_PLACEHOLDER}
        ref={inputRef}
        tabIndex={-1}
        variant={SearchVariant.BACKGROUND}
      />
    </SearchInputWrapper>
  );
}
