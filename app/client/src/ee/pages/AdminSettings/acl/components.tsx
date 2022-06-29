import React from "react";
import { Button, Category, Icon, IconSize, SearchInput } from "components/ads";
import styled, { createGlobalStyle } from "styled-components";

export const AclWrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding: 40px 30px 0 0;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

export const SaveButtonBarWrapper = styled.div`
  position: fixed;
  bottom: 0;
  height: ${(props) => props.theme.settings.footerHeight}px;
  box-shadow: ${(props) => props.theme.settings.footerShadow};
  z-index: 2;
  background-color: ${(props) => props.theme.colors.homepageBackground};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  width: calc(
    100% - ${(props) => props.theme.homePage.leftPane.width}px -
      ${(props) => props.theme.homePage.main.marginLeft}px - 30px
  );
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
  flex-shrink: 0;
  > div {
    border-radius: 1px;
    border: 1px solid var(--appsmith-color-black-250);
    color: var(--appsmith-color-black-700);
    box-shadow: none;
    margin: 0 16px 0 0;

    &:active,
    &:hover,
    &:focus {
      border: 1px solid var(--appsmith-color-black-250);
      box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.06),
        0px 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
`;

const StyledButton = styled(Button)`
  height: 24px;
  display: inline-block;
`;

const StyledSaveButton = styled(StyledButton)`
  width: 128px;
  height: 38px;
  margin-right: 16px;

  & .cs-spinner {
    top: 11px;
  }
`;

const StyledClearButton = styled(StyledButton)`
  width: 68px;
  height: 38px;
`;

const SaveButtonBarText = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.36;
  letter-spacing: -0.24px;
  margin-right: 24px;
`;

const ButtonsWrapper = styled.div`
  flex-shrink: 0;
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

export function SaveButtonBar({
  onClear,
  onSave,
}: {
  onClear: () => void;
  onSave: () => void;
}) {
  return (
    <SaveButtonBarWrapper>
      <SaveButtonBarText>
        These changes will affect the users ability to interact with various
        aspects of the application. Are you sure ?
      </SaveButtonBarText>
      <ButtonsWrapper>
        <StyledSaveButton
          category={Category.primary}
          className="t--admin-settings-save-button"
          disabled={false}
          isLoading={false}
          onClick={() => {
            /*console.log("hello save");*/
            onSave();
          }}
          tag="button"
          text="Save Changes"
        />
        <StyledClearButton
          category={Category.tertiary}
          className="t--admin-settings-reset-button"
          disabled={false}
          onClick={() => {
            /*console.log("hello reset");*/
            onClear();
          }}
          tag="button"
          text="Clear"
        />
      </ButtonsWrapper>
    </SaveButtonBarWrapper>
  );
}
