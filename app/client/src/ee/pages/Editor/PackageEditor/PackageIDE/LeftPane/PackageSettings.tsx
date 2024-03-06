import React from "react";
import EditorSettingsPaneContainer from "pages/Editor/commons/EditorSettingsPaneContainer";
import SettingsPane from "./SettingsPane";

const PackageSettings = () => {
  return (
    <EditorSettingsPaneContainer title="Package Settings">
      <SettingsPane />
    </EditorSettingsPaneContainer>
  );
};

export default PackageSettings;
