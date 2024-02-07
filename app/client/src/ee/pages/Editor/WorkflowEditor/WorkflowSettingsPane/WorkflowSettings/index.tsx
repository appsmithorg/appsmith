import React, { useEffect, useState } from "react";
import type { RouteChildrenProps, RouteComponentProps } from "react-router-dom";
import { useLocation, useHistory } from "react-router-dom";
import styled from "styled-components";
import {
  createMessage,
  GENERAL_SETTINGS_SECTION_HEADER,
  GENERAL_SETTINGS_WORKFLOW_SECTION_HEADER_DESC,
  TRIGGER_SETTINGS_SECTION_HEADER,
  TRIGGER_SETTINGS_SECTION_HEADER_DESC,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Divider } from "design-system";
import type { SectionHeaderProps } from "pages/Editor/AppSettingsPane/AppSettings/SectionHeader";
import SectionHeader from "pages/Editor/AppSettingsPane/AppSettings/SectionHeader";

export function navigateToTab(
  tabKey: string,
  location: RouteChildrenProps["location"],
  history: RouteComponentProps["history"],
) {
  const settingsStartIndex = location.pathname.indexOf("settings");
  const settingsEndIndex = settingsStartIndex + "settings".length;
  const hasSlash = location.pathname[settingsEndIndex] === "/";
  let newUrl = "";

  if (hasSlash) {
    newUrl = `${location.pathname.slice(0, settingsEndIndex)}/${tabKey}`;
  } else {
    newUrl = `${location.pathname}/${tabKey}`;
  }
  history.push(newUrl);
}

export enum WorkflowSettingsTabs {
  Trigger = "trigger",
  General = "general",
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

function WorkflowSettings() {
  const location = useLocation();
  const history = useHistory();

  // Set the selected tab based on the url
  const [selectedTab, setSelectedTab] = useState<WorkflowSettingsTabs>(
    WorkflowSettingsTabs.Trigger,
  );

  useEffect(() => {
    navigateToTab(selectedTab, location, history);
  }, [selectedTab]);

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      id: "t--workflows-trigger-header",
      icon: "lightning",
      isSelected: selectedTab === WorkflowSettingsTabs.Trigger,
      name: createMessage(TRIGGER_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab(WorkflowSettingsTabs.Trigger);
        AnalyticsUtil.logEvent("WORKFLOW_SETTINGS_SECTION_CLICK", {
          section: "Triggers",
        });
      },
      subText: createMessage(TRIGGER_SETTINGS_SECTION_HEADER_DESC),
    },
    {
      id: "t--workflow-general-settings-header",
      icon: "settings-2-line",
      isSelected: selectedTab === WorkflowSettingsTabs.General,
      name: createMessage(GENERAL_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab(WorkflowSettingsTabs.General);
        AnalyticsUtil.logEvent("WORKFLOW_SETTINGS_SECTION_CLICK", {
          section: "General",
        });
      },
      subText: createMessage(GENERAL_SETTINGS_WORKFLOW_SECTION_HEADER_DESC),
    },
  ];

  return (
    <Wrapper className="flex flex-col">
      {SectionHeadersConfig.map((config) => (
        <SectionHeader key={config.name} {...config} />
      ))}
      <Divider />
    </Wrapper>
  );
}

export default WorkflowSettings;
