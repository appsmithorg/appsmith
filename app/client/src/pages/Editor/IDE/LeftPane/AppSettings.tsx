import React from "react";

import EditorSettingsPaneContainer from "pages/Editor/commons/EditorSettingsPaneContainer";

import AppSettingsPane from "../../AppSettingsPane/AppSettings";

const SettingsPane = () => {
  return (
    <EditorSettingsPaneContainer title="App Settings">
      <AppSettingsPane />
    </EditorSettingsPaneContainer>
  );
};

export default SettingsPane;
