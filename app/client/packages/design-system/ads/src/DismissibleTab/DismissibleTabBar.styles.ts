import styled, { css } from "styled-components";

import { Button } from "..";

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
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  height: 32px;

  ${({ $showLeftBorder }) => animatedLeftBorder($showLeftBorder ?? false)};
`;

export const TabsContainer = styled.div`
  display: flex;
  flex: 1 0 auto;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
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
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $showLeftBorder }) => animatedLeftBorder($showLeftBorder ?? false)};
`;

export const PlusButton = styled(Button)`
  min-width: 24px;
`;
