import { APP_SETTINGS_PANE_WIDTH } from "constants/AppConstants";
import AppSettings from "pages/Editor/AppSettingsPane/AppSettings";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { setIdeSidebarWidth } from "../ideActions";

const Container = styled.div`
  width: ${APP_SETTINGS_PANE_WIDTH}px;
`;

const SettingsLeftPane = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setIdeSidebarWidth(APP_SETTINGS_PANE_WIDTH));
  }, []);

  return (
    <Container>
      <AppSettings />
    </Container>
  );
};

export default SettingsLeftPane;
