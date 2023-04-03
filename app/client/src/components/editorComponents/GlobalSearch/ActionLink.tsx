import React from "react";
import { Icon, IconSize } from "design-system-old";
import { useContext } from "react";
import styled, { useTheme } from "styled-components";
import SearchContext from "./GlobalSearchContext";
import type { SearchItem } from "./utils";
import type { Theme } from "constants/DefaultTheme";

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
  const theme = useTheme() as Theme;

  return (
    <StyledActionLink isActiveItem={isActiveItem}>
      <Icon
        fillColor={theme.colors.globalSearch.searchItemText}
        name="link"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation(); // to prevent toggleModal getting called twice
          searchContext?.handleItemLinkClick(
            null,
            item,
            "SEARCH_ITEM_ICON_CLICK",
          );
        }}
        size={IconSize.LARGE}
      />
    </StyledActionLink>
  );
};

export default ActionLink;
