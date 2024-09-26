import React from "react";
import { useContext } from "react";
import styled from "styled-components";
import SearchContext from "./GlobalSearchContext";
import type { SearchItem } from "./utils";
import { Button } from "@appsmith/ads";

export const StyledActionLink = styled.span<{ isActiveItem?: boolean }>`
  visibility: ${(props) => (props.isActiveItem ? "visible" : "hidden")};
  display: inline-flex;
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
