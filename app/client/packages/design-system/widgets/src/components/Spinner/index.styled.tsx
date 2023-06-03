import styled from "styled-components";
import { importRemixIcon } from "@design-system/widgets-old";

const LoaderIcon = importRemixIcon(
  () => import("remixicon-react/Loader2FillIcon"),
);

export const StyledSpinner = styled(LoaderIcon)`
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
