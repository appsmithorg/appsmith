import React from "react";
import styled from "styled-components";
import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import AppSettingsPane from "../../AppSettingsPane/AppSettings";
import PaneHeader from "./PaneHeader";

const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${APP_SETTINGS_PANE_WIDTH}px;
  &:nth-child(2) {
    height: 100%;
  }
`;

const SettingsPane = () => {
  return (
    <div className="h-full flex">
      <SettingsPageWrapper>
        <PaneHeader title={"App Settings"} />
        <AppSettingsPane />
      </SettingsPageWrapper>
    </div>
  );
};

export default SettingsPane;
