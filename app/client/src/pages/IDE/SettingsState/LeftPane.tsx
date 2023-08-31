import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import AppSettings from "pages/Editor/AppSettingsPane/AppSettings";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { setIdeSidebarWidth } from "../ideActions";
import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";

const Container = styled.div`
  width: ${APP_SETTINGS_PANE_WIDTH}px;
  height: calc(100vh - ${(props) => props.theme.bottomBarHeight} - 8px);
  overflow: auto;
`;

const SettingsLeftPane = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setIdeSidebarWidth(APP_SETTINGS_PANE_WIDTH));

    return () => {
      dispatch(closeAppSettingsPaneAction());
    };
  }, []);

  return (
    <Container>
      <AppSettings />
    </Container>
  );
};

export default SettingsLeftPane;
