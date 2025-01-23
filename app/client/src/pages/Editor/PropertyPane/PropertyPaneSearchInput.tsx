import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { SearchInput } from "@appsmith/ads";
import { useSelector } from "react-redux";
import {
  getShouldFocusPanelPropertySearch,
  getShouldFocusPropertySearch,
} from "selectors/propertyPaneSelectors";
import { PROPERTY_SEARCH_INPUT_PLACEHOLDER } from "ee/constants/messages";

const Container = styled.div`
  position: sticky;
  top: 44px;
  z-index: 3;
  margin-bottom: 2px;
  background: var(--ads-v2-color-white);
  height: 35px;
`;

const SearchInputWrapper = styled.div`
  margin: 0 1rem;
`;

interface PropertyPaneSearchInputProps {
  onTextChange: (text: string) => void;
  isPanel?: boolean;
}

export function PropertyPaneSearchInput(props: PropertyPaneSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldFocusSearch = useSelector(getShouldFocusPropertySearch);
  const shouldFocusPanelSearch = useSelector(getShouldFocusPanelPropertySearch);
  const isPanel = !!props.isPanel;

  // eslint-disable-next-line @appsmith/named-use-effect
  useEffect(() => {
    // Checks if the property pane opened not because of focusing an input inside a widget
    if (
      shouldFocusSearch ||
      // while the panel transition happens, focus will be happening twice. Once on the main pane and then on the panel
      // The following check will make sure that the focus is only done once and prevents the UI jittering
      (!shouldFocusSearch && isPanel === shouldFocusPanelSearch)
    ) {
      setTimeout(
        () => {
          //checking for active element
          //inside timeout to have updated active element
          inputRef.current?.focus();
        },
        // Layered panels like Column Panel's transition takes 300ms.
        // To avoid UI jittering, we are delaying the focus by 300ms.
        isPanel ? 300 : 0,
      );
    }
  }, [shouldFocusSearch, shouldFocusPanelSearch, isPanel]);

  return (
    <Container tabIndex={-1}>
      <SearchInputWrapper>
        <SearchInput
          className="propertyPaneSearch t--property-pane-search-input-wrapper"
          onChange={props.onTextChange}
          placeholder={PROPERTY_SEARCH_INPUT_PLACEHOLDER}
          ref={inputRef}
          tabIndex={0}
        />
      </SearchInputWrapper>
    </Container>
  );
}
