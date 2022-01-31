import React from "react";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { useContext } from "react";
import styled, { withTheme } from "styled-components";
import SearchContext from "./GlobalSearchContext";
import { SearchItem } from "./utils";

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

export const ActionLink = withTheme(
  ({
    isActiveItem,
    item,
    theme,
  }: {
    item: SearchItem;
    theme: Theme;
    isActiveItem?: boolean;
  }) => {
    const searchContext = useContext(SearchContext);
    return (
      <StyledActionLink isActiveItem={isActiveItem}>
        <Icon
          fillColor={theme.colors.globalSearch.searchItemText}
          name="link"
          onClick={(e) => {
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
  },
);

export default ActionLink;
