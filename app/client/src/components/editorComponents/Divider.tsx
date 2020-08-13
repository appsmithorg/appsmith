import { Divider } from "@blueprintjs/core";
import styled from "styled-components";

export const StyledDivider = styled(Divider)<{ color?: string }>`
  && {
    margin: 10px 0;
  }
`;

export default StyledDivider;
