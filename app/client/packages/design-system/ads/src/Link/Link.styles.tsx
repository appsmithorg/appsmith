import styled, { css } from "styled-components";
import { Link as RouterLink } from "react-router-dom";
import { Icon } from "../Icon";
import type { LinkKind } from "./Link.types";

const Variables = css`
  --ads-v2-action-link-primary-label-default-fg: var(--ads-v2-color-fg-brand);
  --ads-v2-action-link-primary-label-hover-fg: var(
    --ads-v2-color-fg-brand-emphasis
  );
  --ads-v2-action-link-primary-label-active-fg: var(
    --ads-v2-color-fg-brand-emphasis-plus
  );
  --ads-v2-colors-action-link-secondary-surface-hover-border: var(
    --ads-v2-color-border-emphasis
  );
  --ads-v2-colors-action-link-secondary-surface-active-border: var(
    --ads-v2-color-border-emphasis-plus
  );

  --color: var(--ads-v2-action-link-primary-label-default-fg);
  --text-decoration: none;
  --text-decoration-color: none;
`;

const Kind = {
  primary: css`
    --color: var(--ads-v2-action-link-primary-label-default-fg);
    :hover {
      --color: var(--ads-v2-action-link-primary-label-hover-fg);
    }
    :active {
      --color: var(--ads-v2-action-link-primary-label-active-fg);
    }
    :focus:active {
      --color: var(--ads-v2-action-link-primary-label-active-fg);
    }
    :focus {
      --color: var(--ads-v2-action-link-primary-label-default-fg);
    }
  `,
  secondary: css`
    --color: var(--ads-v2-colors-action-secondary-label-default-fg);
    --text-decoration: underline;
    --text-decoration-color: var(
      --ads-v2-colors-action-secondary-surface-default-border
    );
    :hover {
      --color: var(--ads-v2-colors-action-secondary-label-hover-fg);
      --text-decoration-color: var(
        --ads-v2-colors-action-link-secondary-surface-hover-border
      );
    }
    :active {
      --color: var(--ads-v2-colors-action-secondary-label-active-fg);
      --text-decoration-color: var(
        --ads-v2-colors-action-link-secondary-surface-active-border
      );
    }
    :focus:active {
      --color: var(--ads-v2-colors-action-secondary-label-active-fg);
      --text-decoration-color: var(
        --ads-v2-colors-action-link-secondary-surface-active-border
      );
    }
    :focus {
      --color: var(--ads-v2-colors-action-secondary-label-default-fg);
      --text-decoration-color: var(
        --ads-v2-colors-action-secondary-surface-default-border
      );
    }
  `,
};

export const Styles = css<{ kind?: LinkKind }>`
  ${Variables}

  ${({ kind }) => kind && Kind[kind]}

  font-family: var(--ads-v2-font-family);
  /* This override is needed since blueprint is applying styles on a tag. */
  /* TODO: Remove this once blueprint is removed from the main repo. */
  color: var(--color) !important;
  text-decoration: var(--text-decoration) !important;
  text-decoration-color: var(--text-decoration-color) !important;
  text-decoration-skip-ink: all !important;
  text-underline-offset: var(--ads-v2-spaces-2) !important;

  display: flex;
  align-content: center;

  :focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
    border-radius: var(--ads-v2-border-radius);
  }
`;

export const StyledRouterLink = styled(RouterLink)<{ kind?: LinkKind }>`
  ${Styles}
`;

export const StyledAnchor = styled.a<{ kind?: LinkKind }>`
  ${Styles}
`;

export const StyledIcon = styled(Icon)<{
  $position: "start" | "end";
}>`
  margin-right: ${(props) =>
    props.$position == "start" && "var(--ads-v2-spaces-2)"};
  margin-left: ${(props) =>
    props.$position == "end" && "var(--ads-v2-spaces-2)"};
`;
