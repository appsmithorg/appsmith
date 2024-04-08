import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import React from "react";
import styled from "styled-components";
import PaneHeader from "../IDE/LeftPane/PaneHeader";

type EditorSettingsPaneContainerProps = React.PropsWithChildren<{
  title: string;
}>;

const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${APP_SETTINGS_PANE_WIDTH}px;
  &:nth-child(2) {
    height: 100%;
  }
`;

const EditorSettingsPaneContainer = ({
  children,
  title,
}: EditorSettingsPaneContainerProps) => {
  return (
    <div className="h-full flex">
      <SettingsPageWrapper>
        <PaneHeader title={title} />
        {children}
      </SettingsPageWrapper>
    </div>
  );
};

export default EditorSettingsPaneContainer;
