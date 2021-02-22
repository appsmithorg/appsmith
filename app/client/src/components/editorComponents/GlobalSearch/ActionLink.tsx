import React from "react";
import Icon, { IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { useContext } from "react";
import styled, { withTheme } from "styled-components";
import SearchContext from "./GlobalSearchContext";

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
    item: any;
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
          onClick={() => searchContext.handleItemLinkClick(item)}
        />
      </StyledActionLink>
    );
  },
);

export default ActionLink;
