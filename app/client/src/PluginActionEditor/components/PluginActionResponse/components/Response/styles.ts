import styled from "styled-components";
import { Button, Text } from "@appsmith/ads";
import { TAB_BAR_HEIGHT } from "../constants";

export const HelpSection = styled.div``;

export const Root = styled.div`
  display: flex;
  flex-direction: column;
`;

export const DataContainer = styled.div<{ $height: number }>`
  height: calc(${({ $height }) => $height}px - 1px);
  display: grid;
  grid-template-rows: ${TAB_BAR_HEIGHT}px 1fr;
  grid-template-columns: 100%;
  position: relative;
  overflow: clip;
`;

export const Response = styled.div`
  overflow: auto;
  width: 100%;
  height: 100%;
`;

export const StatusBar = styled.div`
  position: sticky;
  top: 0px;
  display: flex;
  justify-content: space-between;
  height: ${TAB_BAR_HEIGHT}px;
  padding: 8px 8px 8px 12px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  z-index: var(--ads-v2-z-index-1);
  background: var(--ads-v2-color-bg);
`;

export const StatusBarInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
`;

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

export const LoadingContainer = styled.div`
  height: calc(100% - ${TAB_BAR_HEIGHT}px);
`;

interface StatusBarTextProps {
  $isBold?: boolean;
  $isError?: boolean;
  $hasTooltip?: boolean;
}

export const StatusBarText = styled(Text)<StatusBarTextProps>`
  font-size: 13px;
  ${({ $hasTooltip }) =>
    $hasTooltip &&
    `text-decoration: underline var(--ads-v2-color-border) dashed;`}
  ${({ $isBold }) => $isBold && `font-weight: 700;`}
  ${({ $isError }) => $isError && `color: var(--ads-v2-color-fg-on-error);`}
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 8px;
  height: fit-content;
  background: var(--ads-v2-color-bg-error);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

export const ErrorContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
`;

export const ErrorDefaultMessage = styled.div`
  flex-shrink: 0;
`;
