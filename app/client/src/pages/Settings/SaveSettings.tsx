import React from "react";
import { createMessage } from "@appsmith/constants/messages";
import { Button } from "design-system";
import styled from "styled-components";

const StyledButton = styled(Button)`
  display: inline-block;
  margin-right: 16px;
`;

const SettingsButtonWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.theme.settings.footerHeight}px;
  padding: ${(props) => props.theme.spaces[11]}px 0px 0px
    ${(props) =>
      props.theme.homePage.leftPane.leftPadding +
      props.theme.homePage.leftPane.width +
      props.theme.spaces[8]}px;
  box-shadow: ${(props) => props.theme.settings.footerShadow};
  z-index: 2;
  background-color: ${(props) => props.theme.colors.homepageBackground};
`;

type SaveAdminSettingsProps = {
  isSaving?: boolean;
  onSave?: () => void;
  onClear?: () => void;
  settings: Record<string, string>;
  valid: boolean;
};

const saveAdminSettings = (props: SaveAdminSettingsProps) => {
  const { isSaving, onClear, onSave, settings, valid } = props;

  return (
    <SettingsButtonWrapper>
      <StyledButton
        className="t--admin-settings-save-button"
        isDisabled={Object.keys(settings).length == 0 || !valid}
        isLoading={isSaving}
        onClick={onSave}
      >
        {createMessage(() => "Save & Restart")}
      </StyledButton>
      <StyledButton
        className="t--admin-settings-reset-button"
        isDisabled={Object.keys(settings).length == 0}
        kind="secondary"
        onClick={onClear}
      >
        {createMessage(() => "Reset")}
      </StyledButton>
    </SettingsButtonWrapper>
  );
};
export default saveAdminSettings;
