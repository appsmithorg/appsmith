import { Spinner, Classes } from "@blueprintjs/core";
import styled from "styled-components";

const StyledSpinner = styled(Spinner)`
  &.${Classes.SPINNER} {
    display: inline-flex;
  }
`;

export default StyledSpinner;
