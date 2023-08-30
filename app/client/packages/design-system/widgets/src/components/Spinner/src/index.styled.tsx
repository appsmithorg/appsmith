import styled from "styled-components";
import { Icon as HeadlessIcon } from "@design-system/headless";

export const StyledSpinner = styled(HeadlessIcon)`
  animation: spin 1s linear infinite;
  height: 1.2rem;
  width: 1.2rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  & path {
    fill: currentColor;
  }
`;
