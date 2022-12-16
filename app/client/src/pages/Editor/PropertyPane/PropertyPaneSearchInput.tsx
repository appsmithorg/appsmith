import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { SearchVariant } from "design-system";
import { InputWrapper, SearchInput } from "design-system";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import {
  getShouldFocusPanelPropertySearch,
  getShouldFocusPropertySearch,
} from "selectors/propertyPaneSelectors";
import { isCurrentFocusOnInput } from "utils/editorContextUtils";
import { PROPERTY_SEARCH_INPUT_PLACEHOLDER } from "@appsmith/constants/messages";
import { setFocusableInputField } from "actions/editorContextActions";
import { getIsInputFieldFocused } from "selectors/editorContextSelectors";
import { AppState } from "@appsmith/reducers";

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
  id: string;
};

export function PropertyPaneSearchInput(props: PropertyPaneSearchInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const shouldFocusSearch = useSelector(getShouldFocusPropertySearch);
  const shouldFocusPanelSearch = useSelector(getShouldFocusPanelPropertySearch);
  const dispatch = useDispatch();
  const isPanel = !!props.isPanel;

  const shouldFocusPropertyPath: boolean = useSelector((state: AppState) =>
    getIsInputFieldFocused(state, `${props.id}.property-pane-search`),
  );
  useEffect(() => {
    // Checks if the property pane opened not because of focusing an input inside a widget
    const isActiveFocusNotFromWidgetInput = !isCurrentFocusOnInput();
    if (
      (shouldFocusPropertyPath || shouldFocusSearch) &&
      isActiveFocusNotFromWidgetInput &&
      // while the panel transition happens, focus will be happening twice. Once on the main pane and then on the panel
      // The following check will make sure that the focus is only done once and prevents the UI jittering
      isPanel === shouldFocusPanelSearch
    ) {
      setTimeout(
        () => {
          wrapperRef.current?.focus();
        },
        // Layered panels like Column Panel's transition takes 300ms.
        // To avoid UI jittering, we are delaying the focus by 300ms.
        isPanel ? 300 : 0,
      );
    }
  }, [
    shouldFocusSearch,
    shouldFocusPropertyPath,
    shouldFocusPanelSearch,
    isPanel,
  ]);

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

  const handleOnFocus = () => {
    dispatch(setFocusableInputField(`${props.id}.property-pane-search`));
  };

  return (
    <SearchInputWrapper
      className="t--property-pane-search-input-wrapper"
      onFocus={handleOnFocus}
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
