import { Divider } from "@blueprintjs/core";
import styled from "styled-components";

export const StyledDivider = styled(Divider)<{ color?: string }>`
  && {
    margin: 5px 0 0;
  }
`;

export default StyledDivider;
