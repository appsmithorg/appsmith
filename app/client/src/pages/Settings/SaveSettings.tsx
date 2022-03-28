import Button, { Category } from "components/ads/Button";
import { createMessage } from "@appsmith/constants/messages";
import React from "react";
import styled from "styled-components";
import { Setting } from "@appsmith/pages/AdminSettings/config/types";

const StyledButton = styled(Button)`
  height: 24px;
  display: inline-block;
  margin-right: 16px;
`;

const StyledSaveButton = styled(StyledButton)`
  width: 128px;
  height: 38px;

  & .cs-spinner {
    top: 11px;
  }
`;

const StyledClearButton = styled(StyledButton)`
  width: 68px;
  height: 38px;
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
      props.theme.homePage.main.marginLeft -
      props.theme.spaces[11]}px;
  box-shadow: ${(props) => props.theme.settings.footerShadow};
  z-index: 2;
  background-color: ${(props) => props.theme.colors.homepageBackground};
`;

const saveAdminSettings = (props: {
  isSaving?: boolean;
  onSave?: () => void;
  onClear?: () => void;
  settings: Record<string, string>;
  settingsConfig: Record<string, string | boolean>;
  settingsDetails: Setting[];
  valid: boolean;
}) => {
  const checkForEnabling = () => {
    let disabled = false;
    const requiredFields = props.settingsDetails.filter((eachSetting) => {
      if (
        eachSetting.isRequired &&
        !eachSetting.isHidden &&
        (((props.settingsConfig[eachSetting.id]?.toString().trim() === "" ||
          props.settingsConfig[eachSetting.id] === undefined) &&
          !props.settings[eachSetting.id]) ||
          (!props.settingsConfig[eachSetting.id] &&
            props.settings[eachSetting.id]?.trim() === ""))
      ) {
        return eachSetting.id;
      }
    });

    if (
      requiredFields.length > 0 ||
      Object.keys(props.settings).length == 0 ||
      !props.valid
    ) {
      disabled = true;
    }

    return disabled;
  };

  return (
    <SettingsButtonWrapper>
      <StyledSaveButton
        category={Category.primary}
        className="t--admin-settings-save-button"
        disabled={checkForEnabling()}
        isLoading={props.isSaving}
        onClick={props.onSave}
        tag="button"
        text={createMessage(() => "Save & Restart")}
      />
      <StyledClearButton
        category={Category.tertiary}
        className="t--admin-settings-reset-button"
        disabled={Object.keys(props.settings).length == 0}
        onClick={props.onClear}
        tag="button"
        text={createMessage(() => "Reset")}
      />
    </SettingsButtonWrapper>
  );
};
export default saveAdminSettings;
