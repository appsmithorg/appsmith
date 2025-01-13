import styled from "styled-components";
import { Text } from "../../../Text";

export const EntityEditableName = styled(Text)`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;

  &[data-isediting="true"] {
    height: 32px;
    line-height: 32px;
    min-width: 3ch;
    text-overflow: unset;
  }
`;
