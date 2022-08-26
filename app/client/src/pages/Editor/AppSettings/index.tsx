import React, { useState } from "react";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings/GeneralSettings";
import AppSettingsSectionHeader from "./GeneralSettings/AppSettingsSectionHeader";

interface AppSettingsProps {
  className?: string;
}

enum Tabs {
  General,
  Theme,
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

const TabContentContainer = styled.div`
  box-shadow: -1px 0 0 0 #e0dede;
`;

function AppSettings(props: AppSettingsProps) {
  const [selectedTab, setSelectedTab] = useState(Tabs.General);

  return (
    <Wrapper className={`${props.className} flex flex-row`}>
      <div className="basis-1/2">
        <div
          className="cursor-pointer"
          onClick={() => {
            setSelectedTab(Tabs.General);
          }}
        >
          <AppSettingsSectionHeader
            icon="settings-2-line"
            isSelected={selectedTab === Tabs.General}
            name="General"
            subText="App name, icon , share"
          />
        </div>
        <div
          className="cursor-pointer"
          onClick={() => {
            setSelectedTab(Tabs.Theme);
          }}
        >
          <AppSettingsSectionHeader
            icon="edit-line"
            isSelected={selectedTab === Tabs.Theme}
            name="Theme"
            subText="Set theme, color and font"
          />
        </div>
        <div className="border-t-[1px] border-[#d7d7d7]" />
      </div>
      <TabContentContainer className="basis-1/2">
        {(() => {
          switch (selectedTab) {
            case Tabs.General:
              return <GeneralSettings />;
            case Tabs.Theme:
              return <div>Theme settings</div>;
          }
        })()}
      </TabContentContainer>
    </Wrapper>
  );
}

export default AppSettings;
