import React from "react";
import {
  RESET_BUTTON,
  SAVE_AND_RESTART_BUTTON,
  SAVE_BUTTON,
  createMessage,
} from "@appsmith/constants/messages";
import { Button } from "design-system";
import styled from "styled-components";

const SettingsButtonWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
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

type SaveAdminSettingsProps = {
  isSaving?: boolean;
  onSave?: () => void;
  onClear?: () => void;
  settings: Record<string, string>;
  valid: boolean;
  updatedTenantSettings?: string[];
};

const saveAdminSettings = (props: SaveAdminSettingsProps) => {
  const { isSaving, onClear, onSave, settings, updatedTenantSettings, valid } =
    props;

  return (
    <SettingsButtonWrapper>
      <Button
        className="t--admin-settings-save-button"
        isDisabled={Object.keys(settings).length == 0 || !valid}
        isLoading={isSaving}
        onClick={onSave}
        size="md"
      >
        {createMessage(
          updatedTenantSettings?.length === Object.keys(settings).length &&
            updatedTenantSettings?.length !== 0
            ? SAVE_BUTTON
            : SAVE_AND_RESTART_BUTTON,
        )}
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
