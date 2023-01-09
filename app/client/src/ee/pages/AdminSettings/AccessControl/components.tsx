import React from "react";
import { Button, Category, SearchInput } from "design-system";
import styled, { createGlobalStyle } from "styled-components";
import { Spinner } from "@blueprintjs/core";
import {
  createMessage,
  BOTTOM_BAR_CLEAR_BTN,
  BOTTOM_BAR_SAVE_BTN,
  BOTTOM_BAR_SAVE_MESSAGE,
  NO_SEARCH_DATA_TEXT,
} from "@appsmith/constants/messages";
import NoDataFound from "assets/images/empy-state.png";

export enum INVITE_USERS_TAB_ID {
  VIA_GROUPS = "via-groups",
  VIA_ROLES = "via-roles",
}

export const AclWrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin: 32px 0 0 0;
  padding: 0 30px 0 24px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);

  .scrollable-wrapper {
    height: 100%;

    &.role-edit-wrapper {
      .react-tabs__tab-panel {
        height: calc(100% - 120px);
        overflow: unset;

        .save-button-bar {
          bottom: 4px;
          flex-shrink: 0;
          margin: auto;
        }
      }
    }
  }
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
  min-width: 800px;
  width: calc(100% - 320px);
`;

export const TabsWrapper = styled.div<{ isEditing?: boolean }>`
  overflow: auto;
  height: calc(100% - 80px);
  .react-tabs__tab-list {
    border-bottom: 1px solid var(--appsmith-color-black-200);
    padding: 36px 0 0;
  }
  .react-tabs__tab-panel {
    height: ${({ isEditing }) =>
      isEditing ? `calc(100% - 148px - 80px)` : `calc(100% - 148px)`};
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

export const StyledSearchInput = styled(SearchInput)`
  > div {
    border-radius: 1px;
    border: 1px solid var(--appsmith-color-black-250);
    color: var(--appsmith-color-black-700);
    box-shadow: none;
    margin: 0 16px 0 0;
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

export function SaveButtonBar({
  isLoading,
  onClear,
  onSave,
}: {
  isLoading?: boolean;
  onClear: () => void;
  onSave: () => void;
}) {
  return (
    <SaveButtonBarWrapper className="save-button-bar">
      <SaveButtonBarText>
        {createMessage(BOTTOM_BAR_SAVE_MESSAGE)}
      </SaveButtonBarText>
      <ButtonsWrapper>
        <StyledSaveButton
          category={Category.primary}
          className="t--admin-settings-save-button"
          data-testid="t--admin-settings-save-button"
          disabled={false}
          isLoading={isLoading || false}
          onClick={() => {
            onSave();
          }}
          tag="button"
          text={createMessage(BOTTOM_BAR_SAVE_BTN)}
        />
        <StyledClearButton
          category={Category.secondary}
          className="t--admin-settings-reset-button"
          data-testid="t--admin-settings-reset-button"
          disabled={false}
          onClick={() => {
            onClear();
          }}
          tag="button"
          text={createMessage(BOTTOM_BAR_CLEAR_BTN)}
        />
      </ButtonsWrapper>
    </SaveButtonBarWrapper>
  );
}

export const LoaderContainer = styled.div`
  justify-content: center;
  align-items: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  .bp3-spinner {
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export const LoaderText = styled.div`
  font-size: 16px;
  color: var(--appsmith-color-black-700);
  line-height: 1.5;
  text-align: center;
`;

const NoResultsText = styled.div`
  font-size: 16px;
  line-height: 1.5;
  color: var(--appsmith-color-black-700);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: 600;

  img {
    margin-bottom: 8px;
  }
`;

export const Loader = ({ loaderText }: { loaderText?: string }) => {
  return (
    <LoaderContainer>
      <Spinner />
      <LoaderText>{loaderText}</LoaderText>
    </LoaderContainer>
  );
};

export const EmptyDataState = ({ page }: { page: string }) => {
  return <NoResultsText>{`There are no ${page} added`}</NoResultsText>;
};

export const EmptySearchResult = () => {
  return (
    <NoResultsText>
      <img alt="No data" src={NoDataFound} />
      <div>{createMessage(NO_SEARCH_DATA_TEXT)}</div>
    </NoResultsText>
  );
};
