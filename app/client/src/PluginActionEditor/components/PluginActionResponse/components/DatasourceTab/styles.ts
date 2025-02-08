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
  & .ads-v2-listitem {
    .datasource-table-icon {
      display: none;
    }
  }
`;
