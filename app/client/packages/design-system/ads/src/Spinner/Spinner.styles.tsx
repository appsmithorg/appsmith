import styled, { keyframes } from "styled-components";
import { SpinnerIconClassName } from "./Spinner.constants";

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const StyledSpinner = styled.span`
  color: var(--ads-v2-colors-content-icon-default-fg);

  .${SpinnerIconClassName} {
    animation: 1.8s ${spin} linear infinite;
  }
`;
