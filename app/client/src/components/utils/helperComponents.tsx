import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useHistory } from "react-router-dom";
import { truncateTextUsingEllipsis } from "constants/DefaultTheme";
import { Link, Text } from "@appsmith/ads";

export const HelpPopoverStyle = createGlobalStyle`
  .bp3-portal {
    .delete-menu-item {
      .ads-v2-icon, .cs-text {
        color: var(--appsmith-color-red-500) !important;
        svg {
          path {
            fill: var(--appsmith-color-red-500) !important;
          }
        }
      }
    }
  }
`;

export const StyledBackLink = styled(Link)`
  display: inline-flex;
  margin: 0 0 var(--ads-v2-spaces-7) 0;
`;

export const SettingsHeader = styled(Text)`
  padding: 0px 8px 0 0;
  margin-bottom: 0px;
  width: 365px;
  ${truncateTextUsingEllipsis}
`;

export const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  background: var(--ads-v2-color-bg);
  padding-bottom: 8px;
  z-index: 4;
`;

export function BackButton({ goTo }: { goTo?: string }) {
  const history = useHistory();

  const onBack = () => {
    if (goTo) {
      history.push(goTo);

      return;
    }

    history.goBack();
  };

  return (
    <StyledBackLink
      className="t--admin-settings-back-button"
      kind="secondary"
      onClick={onBack}
      startIcon="back-control"
    >
      Back
    </StyledBackLink>
  );
}
