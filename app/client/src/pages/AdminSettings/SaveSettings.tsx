import React from "react";
import {
  RESET_BUTTON,
  SAVE_AND_REFRESH_BUTTON,
  SAVE_AND_RESTART_BUTTON,
  SAVE_BUTTON,
  createMessage,
} from "ee/constants/messages";
import { Button } from "@appsmith/ads";
import styled from "styled-components";

const SettingsButtonWrapper = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  width: ${(props) => `calc(100% - ${props.theme.sidebarWidth})`};
  height: ${(props) => props.theme.settings.footerHeight}px;
  padding: ${(props) => props.theme.spaces[11]}px 20px 24px
    ${(props) =>
      props.theme.homePage.leftPane.leftPadding +
      props.theme.homePage.leftPane.width +
      props.theme.spaces[8]}px;
  /* box-shadow: ${(props) => props.theme.settings.footerShadow}; */
  border-top: 1px solid var(--ads-v2-color-border);
  z-index: 2;
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  align-items: center;
`;

interface SaveAdminSettingsProps {
  isOnlyOrganizationConfig?: boolean;
  isSaving?: boolean;
  needsRefresh?: boolean;
  onSave?: () => void;
  onClear?: () => void;
  settings: Record<string, string>;
  valid: boolean;
  updatedOrganizationSettings?: string[];
}

const saveAdminSettings = (props: SaveAdminSettingsProps) => {
  const {
    isOnlyOrganizationConfig = false,
    isSaving,
    needsRefresh = false,
    onClear,
    onSave,
    settings,
    updatedOrganizationSettings,
    valid,
  } = props;

  let saveButtonText = SAVE_AND_RESTART_BUTTON;

  if (needsRefresh) {
    saveButtonText = SAVE_AND_REFRESH_BUTTON;
  } else if (
    isOnlyOrganizationConfig ||
    (updatedOrganizationSettings?.length === Object.keys(settings).length &&
      updatedOrganizationSettings?.length !== 0)
  ) {
    saveButtonText = SAVE_BUTTON;
  }

  return (
    <SettingsButtonWrapper>
      <Button
        className="t--admin-settings-save-button"
        isDisabled={Object.keys(settings).length == 0 || !valid}
        isLoading={isSaving}
        onClick={onSave}
        size="md"
      >
        {createMessage(saveButtonText)}
      </Button>
      <Button
        className="t--admin-settings-reset-button"
        isDisabled={Object.keys(settings).length == 0}
        kind="secondary"
        onClick={onClear}
        size="md"
      >
        {createMessage(RESET_BUTTON)}
      </Button>
    </SettingsButtonWrapper>
  );
};

export default saveAdminSettings;
