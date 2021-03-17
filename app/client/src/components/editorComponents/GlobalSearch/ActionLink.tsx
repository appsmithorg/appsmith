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
`;

export const ActionLink = withTheme(
  ({
    item,
    theme,
    isActiveItem,
  }: {
    item: SearchItem;
    theme: Theme;
    isActiveItem?: boolean;
  }) => {
    const searchContext = useContext(SearchContext);
    return (
      <StyledActionLink isActiveItem={isActiveItem}>
        <Icon
          name="link"
          size={IconSize.LARGE}
          fillColor={theme.colors.globalSearch.searchItemText}
          onClick={(e) => {
            e.stopPropagation(); // to prevent toggleModal getting called twice
            searchContext?.handleItemLinkClick(item, "SEARCH_ITEM_ICON_CLICK");
          }}
        />
      </StyledActionLink>
    );
  },
);

export default ActionLink;
