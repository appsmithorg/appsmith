import styled, { css } from "styled-components";
import { Flex, Text } from "@appsmith/ads";

const imgSizer = css`
  img {
    height: 16px;
    width: 16px;
  }
`;

export const Group = styled(Flex)`
  .query-item {
    ${imgSizer}
  }
`;

export const GroupName = styled(Text)`
  padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-3);
`;

export const SelectedItem = styled(Flex)`
  ${imgSizer}
`;
