import styled from "styled-components";
import { Text } from "@appsmith/ads";

export const FilterWrapper = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 256}px);

  .more {
    padding-left: ${(props) => props.theme.spaces[11]}px;
    cursor: pointer;
  }

  .hide {
    visibility: hidden;
  }
`;

export const FilterItemWrapper = styled.div<{ selected: boolean }>`
  padding: 8px;
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg)" : "inherit"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
`;

export const FilterItemText = styled(Text)`
  font-size: 14px;
  font-weight: 400;
`;

export const StyledFilterCategory = styled(Text)`
  margin-top: 12px;
  padding-left: 8px;
  text-transform: capitalize;
  font-size: 14px;
  font-weight: 500;

  &.title {
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

export const ListWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[2]}px;
`;

export const FilterCategoryWrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[13] - 11}px;
`;

export const SearchWrapper = styled.div<{ sticky?: boolean }>`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
  .templates-search {
    max-width: 250px;
  }
  ${(props) =>
    props.sticky &&
    `position: sticky;
  top: 0;
  position: -webkit-sticky;
  z-index: 1;
  background-color: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-7);
  margin-left: 0;
  `}
`;
