import React from "react";
import { useContext } from "react";
import styled, { useTheme } from "styled-components";
import SearchContext from "./GlobalSearchContext";
import { SearchItem } from "./utils";
import { Theme } from "constants/DefaultTheme";
import { Button } from "design-system";

export const StyledActionLink = styled.span<{ isActiveItem?: boolean }>`
  visibility: ${(props) => (props.isActiveItem ? "visible" : "hidden")};
  display: inline-flex;
  svg {
    fill: none;
    rect,
    path {
      stroke: ${(props) => props.theme.colors.globalSearch.secondaryTextColor};
    }
  }
`;

export const ActionLink = ({
  isActiveItem,
  item,
}: {
  item: SearchItem;
  isActiveItem?: boolean;
}) => {
  const searchContext = useContext(SearchContext);

  return (
    <StyledActionLink isActiveItem={isActiveItem}>
      <Button
        isIconButton
        kind="tertiary"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation(); // to prevent toggleModal getting called twice
          searchContext?.handleItemLinkClick(
            null,
            item,
            "SEARCH_ITEM_ICON_CLICK",
          );
        }}
        size="sm"
        startIcon="link"
      />
    </StyledActionLink>
  );
};

export default ActionLink;
