import { Button } from "@appsmith/ads";
import styled from "styled-components";
import { TAB_BAR_HEIGHT } from "../../../constants";

export const Fab = styled(Button)<{ $isVisible: boolean }>`
  && {
    position: absolute;
    right: 20px;
    bottom: calc(${TAB_BAR_HEIGHT}px + 20px);
    box-shadow: 0px 1px 20px 0px rgba(76, 86, 100, 0.11);
    z-index: var(--ads-v2-z-index-3);
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: opacity 0.25s;
  }
`;
