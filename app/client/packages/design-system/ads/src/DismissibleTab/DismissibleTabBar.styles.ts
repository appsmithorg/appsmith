import styled, { css } from "styled-components";

import { Button } from "../Button";

export const animatedLeftBorder = (showLeftBorder: boolean) => css`
  transition: border-color 0.5s ease;
  border-left: 1px solid transparent;

  border-left-color: ${showLeftBorder
    ? "var(--ads-v2-color-border-muted)"
    : "transparent"};
`;

export const Root = styled.div<{
  $showLeftBorder?: boolean;
}>`
  display: flex;
  align-items: center;
  overflow-x: hidden;
  white-space: nowrap;
  position: relative;
  max-height: 32px;
  min-height: 32px;

  ${({ $showLeftBorder }) => animatedLeftBorder($showLeftBorder ?? false)};
`;

export const TabsContainer = styled.div`
  display: flex;
  flex: 1 0 auto;
  align-items: center;
  height: 100%;
`;

export const StickySentinel = styled.div`
  width: 1px;
  height: 100%;
`;

export const PlusButtonContainer = styled.div<{ $showLeftBorder?: boolean }>`
  position: sticky;
  right: 0;
  border: none;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $showLeftBorder }) => animatedLeftBorder($showLeftBorder ?? false)};
`;

export const PlusButton = styled(Button)`
  min-width: 24px;
`;
