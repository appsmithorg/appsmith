import React from "react";
import { Text } from "design-system";
import styled from "styled-components";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import AppSettingsPane from "../AppSettingsPane/AppSettings";

const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${APP_SETTINGS_PANE_WIDTH}px;
  border-right: 1px solid var(--ads-v2-color-border);
  &:nth-child(2) {
    height: 100%;
  }
`;

const SettingsPaneHeader = styled.div`
  padding: var(--ads-v2-spaces-4);
  padding-left: var(--ads-v2-spaces-5);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const SettingsPane = () => {
  return (
    <div className="h-full flex">
      <SettingsPageWrapper>
        <SettingsPaneHeader>
          <Text>App Settings</Text>
        </SettingsPaneHeader>
        <AppSettingsPane />
      </SettingsPageWrapper>
    </div>
  );
};

export default SettingsPane;
