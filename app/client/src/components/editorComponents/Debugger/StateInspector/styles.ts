import styled, { css } from "styled-components";
import { Flex } from "@appsmith/ads";

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

export const SelectedItem = styled(Flex)`
  ${imgSizer}
`;
