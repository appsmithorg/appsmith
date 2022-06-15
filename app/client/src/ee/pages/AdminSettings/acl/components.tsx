import React from "react";
import { Icon, IconSize, SearchInput } from "components/ads";
import styled, { createGlobalStyle } from "styled-components";

export const AclWrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding: 40px 30px 0 0;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

export const TabsWrapper = styled.div`
  margin: 36px 0 0;

  .react-tabs__tab-list {
    border-bottom: 1px solid var(--appsmith-color-black-200);
  }
`;

export const HelpPopoverStyle = createGlobalStyle`
  .bp3-portal {
    .delete-menu-item {
      .cs-icon, .cs-text {
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

export const ContentWrapper = styled.div`
  margin: 24px 0 0;
`;

export const AppsmithIcon = styled.div`
  margin: 0px 8px;
  color: var(--appsmith-color-black-0);
  background: var(--appsmith-color-orange-500);
  padding: 1.5px 4px;
  font-size: 12px;
  line-height: 14px;
  font-weight: 600;
`;

export const StyledBackButton = styled.div`
  display: flex;
  cursor: pointer;
  margin: 0 0 20px 0;
`;

export const BackButtonText = styled.span`
  margin: 0 0 0 8px;
`;

export const StyledSearchInput = styled(SearchInput)`
  > div {
    border-radius: 1px;
    border: 1px solid var(--appsmith-color-black-250);
    color: var(--appsmith-color-black-700);
    box-shadow: none;

    &:active,
    &:hover,
    &:focus {
      border: 1px solid var(--appsmith-color-black-250);
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06),
        0px 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
`;

export function BackButton() {
  const onBack = () => {
    history.back();
  };

  return (
    <StyledBackButton
      className="t--admin-settings-back-button"
      onClick={onBack}
    >
      <Icon name="chevron-left" size={IconSize.XS} />
      <BackButtonText>Back</BackButtonText>
    </StyledBackButton>
  );
}
