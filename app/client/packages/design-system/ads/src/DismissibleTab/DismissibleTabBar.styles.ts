import styled from "styled-components";

import { Button } from "..";

export const Root = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  position: relative;
  height: 32px;
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
`;

export const PlusButtonContainer = styled.div<{ $isStuck?: boolean }>`
  position: sticky;
  right: 0;
  border: none;
  min-width: 32px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $isStuck }) =>
    $isStuck &&
    `
      border-left: 1px solid var(--ads-v2-color-border-muted);
    `}
`;

export const PlusButton = styled(Button)`
  min-width: 24px;
`;
