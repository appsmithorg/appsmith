import styled from "styled-components";
import { List } from "../../../List";
import { Text } from "../../../Text";
import { Flex } from "../../../Flex";

export const StyledGroup = styled(Flex)`
  & .ads-v2-listitem .ads-v2-listitem__idesc {
    opacity: 0;
  }

  & .ads-v2-listitem:hover .ads-v2-listitem__idesc {
    opacity: 1;
  }
`;

export const StyledList = styled(List)`
  padding: 0;
`;

export const LoadMore = styled(Text)`
  color: var(--ads-v2-color-fg-subtle);
  padding: var(--ads-v2-spaces-2);
  padding-left: var(--ads-v2-spaces-3);
  cursor: pointer;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }
`;
