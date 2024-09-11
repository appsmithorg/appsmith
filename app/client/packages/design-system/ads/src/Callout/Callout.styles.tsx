import styled, { css } from "styled-components";
import type { CalloutKind } from "./Callout.types";
import { Button } from "../Button";
import { Text } from "../Text";

const Variables = css`
  --callout-color-background: var(
    --ads-v2-colors-response-info-surface-default-bg
  );
`;

const KindMap = {
  success: css`
    --callout-color-background: var(
      --ads-v2-colors-response-success-surface-default-bg
    );
  `,
  warning: css`
    --callout-color-background: var(
      --ads-v2-colors-response-warning-surface-default-bg
    );
  `,
  info: css`
    --callout-color-background: var(
      --ads-v2-colors-response-info-surface-default-bg
    );
  `,
  error: css`
    --callout-color-background: var(
      --ads-v2-colors-response-error-surface-default-bg
    );
  `,
};

export const StyledCallout = styled.div<{
  isClosed?: boolean;
  kind: CalloutKind;
}>`
  ${Variables}

  ${({ kind }) => kind && KindMap[kind]}

  // TODO: get minh, minw from vasanth (with all optionals switched off)
  min-height: 40px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-3);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);

  // to ensure that small window sizes don't reduce the background size of callout
  flex-shrink: 0;

  background-color: var(--callout-color-background);

  ${({ isClosed }) => isClosed && `display: none;`}
`;

export const StyledCloseButton = styled(Button)`
  && {
    margin-left: auto;
    cursor: pointer;
    min-width: fit-content;
  }
`;

export const StyledLinks = styled.div`
  display: flex;
  flex-direction: row;
  gap: var(--ads-v2-spaces-4);
  margin-top: var(--ads-v2-spaces-3);
  margin-bottom: var(--ads-v2-spaces-1);
`;

export const StyledIconContainer = styled.div``;

export const StyledChildrenContainer = styled.div`
  margin-top: var(--ads-v2-spaces-1);
`;

export const StyledChildren = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
`;
