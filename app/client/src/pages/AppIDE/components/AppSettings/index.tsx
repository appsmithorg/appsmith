import React from "react";
import AppSettings from "./AppSettings";
import EditorSettingsPaneContainer from "pages/Editor/commons/EditorSettingsPaneContainer";

const SettingsPane = () => {
  return (
    <EditorSettingsPaneContainer title="App Settings">
      <AppSettings />
    </EditorSettingsPaneContainer>
  );
};

export default SettingsPane;
