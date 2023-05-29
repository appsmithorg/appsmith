import React from "react";
import {
  Button,
  SearchInput,
  Spinner,
  Switch,
  Tabs,
  Tag,
  Text,
} from "design-system";
import styled from "styled-components";
import {
  createMessage,
  BOTTOM_BAR_CLEAR_BTN,
  BOTTOM_BAR_SAVE_BTN,
  BOTTOM_BAR_SAVE_MESSAGE,
  NO_SEARCH_DATA_TEXT,
  DEFAULT_ROLES_PILL,
  DEFAULT_ROLES_TOGGLE_TEXT,
} from "@appsmith/constants/messages";
import NoDataFound from "assets/images/empy-state.png";

export enum INVITE_USERS_TAB_ID {
  VIA_GROUPS = "via-groups",
  VIA_ROLES = "via-roles",
}

export const AclWrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  padding: var(--ads-v2-spaces-7);
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  position: relative;

  .scrollable-wrapper {
    height: 100%;
  }

  &.roles-listing-wrapper {
    .toggle-wrapper {
      position: absolute;
      right: 40px;
      top: 92px;
      z-index: 2;
    }
  }
`;

export const SaveButtonBarWrapper = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  height: ${(props) => props.theme.settings.footerHeight}px;
  border-top: 1px solid var(--ads-v2-color-border);
  z-index: 2;
  background-color: var(--ads-v2-color-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  min-width: 800px;
  width: 100%;
`;

export const StyledTabs = styled(Tabs)`
  margin: 24px 0 0;

  height: calc(100% - 180px);
  .tab-panel {
    overflow: auto;
    height: 100%;

    &.is-editing {
      height: calc(100% - 80px);
    }
  }
`;

export const MoreInfoPill = styled(Tag)`
  margin: 0px 0px 0px 8px;
`;

export const StyledSearchInput = styled(SearchInput)`
  display: flex;
  width: 376px;
  margin: 0 16px 0 0;
`;

const StyledButton = styled(Button)`
  display: inline-block;
`;

const StyledSaveButton = styled(StyledButton)`
  margin-left: 16px;
`;

const SaveButtonBarText = styled(Text)`
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
      <SaveButtonBarText color="var(--ads-v2-color-fg-emphasis-plus)">
        {createMessage(BOTTOM_BAR_SAVE_MESSAGE)}
      </SaveButtonBarText>
      <ButtonsWrapper>
        <StyledButton
          className="t--admin-settings-reset-button"
          data-testid="t--admin-settings-reset-button"
          isDisabled={false}
          kind="secondary"
          onClick={() => {
            onClear();
          }}
          size="md"
        >
          {createMessage(BOTTOM_BAR_CLEAR_BTN)}
        </StyledButton>
        <StyledSaveButton
          className="t--admin-settings-save-button"
          data-testid="t--admin-settings-save-button"
          isDisabled={false}
          isLoading={isLoading || false}
          onClick={() => {
            onSave();
          }}
          size="md"
        >
          {createMessage(BOTTOM_BAR_SAVE_BTN)}
        </StyledSaveButton>
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
`;

export const LoaderText = styled(Text)`
  color: var(--ads-v2-color-fg);
  text-align: center;
`;

const NoResultsText = styled.div`
  color: var(--ads-v2-color-fg);
  display: flex;
  flex-direction: column;
  align-items: center;

  img {
    margin-bottom: 8px;
  }
`;

const ToggleText = styled.div`
  display: flex;
  align-items: center;

  .toggle-message {
    margin: 0 8px 0 4px;
  }
`;

export const Loader = ({ loaderText }: { loaderText?: string }) => {
  return (
    <LoaderContainer>
      <Spinner size="lg" />
      <LoaderText kind="heading-s" renderAs="p">
        {loaderText}
      </LoaderText>
    </LoaderContainer>
  );
};

export const EmptyDataState = ({ page }: { page: string }) => {
  return (
    <Text
      color="var(--ads-v2-color-fg)"
      kind="heading-s"
      renderAs="p"
    >{`There are no ${page} added`}</Text>
  );
};

export const EmptySearchResult = () => {
  return (
    <NoResultsText>
      <img alt="No data" src={NoDataFound} />
      <Text kind="heading-s" renderAs="p">
        {createMessage(NO_SEARCH_DATA_TEXT)}
      </Text>
    </NoResultsText>
  );
};

export const DefaultRolesToggle = ({
  isToggleActive,
  setIsToggleActive,
}: {
  isToggleActive: boolean;
  setIsToggleActive: (val: boolean) => void;
}) => {
  return (
    <div className="toggle-wrapper" data-testid="t--toggle-wrapper">
      <Switch
        data-testid="default-roles-toggle"
        isSelected={isToggleActive}
        onChange={() => setIsToggleActive(!isToggleActive)}
      >
        <ToggleText>
          <MoreInfoPill isClosable={false}>
            {createMessage(DEFAULT_ROLES_PILL)}
          </MoreInfoPill>
          <Text className="toggle-message" renderAs="span">
            {createMessage(DEFAULT_ROLES_TOGGLE_TEXT)}
          </Text>
        </ToggleText>
      </Switch>
    </div>
  );
};
