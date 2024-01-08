import React from "react";
import styled from "styled-components";
import PaneHeader from "pages/Editor/IDE/LeftPane/PaneHeader";
import WorkflowSettingsPane from "../../WorkflowSettingsPane";
import { WORKFLOW_SETTINGS_PANE_WIDTH } from "@appsmith/constants/WorkflowConstants";

const SettingsPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: ${WORKFLOW_SETTINGS_PANE_WIDTH}px;
  &:nth-child(2) {
    height: 100%;
  }
`;

const SettingsPane = () => {
  return (
    <div className="h-full flex">
      <SettingsPageWrapper>
        <PaneHeader title={"Workflow Settings"} />
        <WorkflowSettingsPane />
      </SettingsPageWrapper>
    </div>
  );
};

export default SettingsPane;
