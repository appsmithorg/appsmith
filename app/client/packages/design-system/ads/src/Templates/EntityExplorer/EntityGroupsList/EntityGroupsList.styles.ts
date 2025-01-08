import styled from "styled-components";
import { Flex } from "../../../Flex";
import { ListItem } from "../../../List";

export const GroupsListWrapper = styled(Flex)`
  & .groups-list-group:last-child {
    border-bottom: none;
  }
`;

export const LoadMore = styled(ListItem)`
  color: var(--ads-v2-color-fg-subtle);
`;
