import React from "react";
import { IconNames } from "@blueprintjs/icons";
import { Icon, IconSize } from "design-system";
import { PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE } from "@appsmith/constants/messages";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const EmptySearchResultWrapper = styled.div`
  color: ${Colors.GRAY_700};

  span {
    cursor: default;
  }

  svg {
    fill: ${Colors.GRAY_400};
  }
`;

export function EmptySearchResult() {
  return (
    <EmptySearchResultWrapper className="mt-12 p-3 t--property-pane-no-search-results">
      <Icon
        className="flex justify-center"
        name={IconNames.SEARCH}
        size={IconSize.XXXL}
      />
      <p className="pt-3 text-center">
        {PROPERTY_PANE_EMPTY_SEARCH_RESULT_MESSAGE}
      </p>
    </EmptySearchResultWrapper>
  );
}
