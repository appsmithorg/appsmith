import styled from "styled-components";
import { Flex } from "@appsmith/ads";

export const TableColumn = styled(Flex)`
  & .t--datasource-column {
    padding: 0;

    & > div {
      margin: 0;
    }
  }
`;

export const SchemaTableContainer = styled(Flex)`
  & .t--entity-item {
    height: 28px;
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;

    .entity-icon > .ads-v2-icon {
      display: none;
    }
  }
`;
