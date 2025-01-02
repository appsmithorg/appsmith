import styled from "styled-components";
import { Text } from "../../..";

export const EntityEditableName = styled(Text)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &[data-isediting="true"] {
    height: 32px;
    line-height: 32px;
    flex: 1;
    min-width: 3ch;
    text-overflow: unset;
  }
`;
