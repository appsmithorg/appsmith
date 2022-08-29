import React, { useState } from "react";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings";
import SectionHeader, { SectionHeaderProps } from "./SectionHeader";

enum Tabs {
  General,
  Theme,
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

const SectionContent = styled.div`
  box-shadow: -1px 0 0 0 #e0dede;
`;

function AppSettings() {
  const [selectedTab, setSelectedTab] = useState(Tabs.General);

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      icon: "settings-2-line",
      isSelected: selectedTab === Tabs.General,
      name: "General",
      onClick: () => {
        setSelectedTab(Tabs.General);
      },
      subText: "App name, icon , share",
    },
    {
      icon: "edit-line",
      isSelected: selectedTab === Tabs.Theme,
      name: "Theme",
      onClick: () => {
        setSelectedTab(Tabs.Theme);
      },
      subText: "Set theme, color and font",
    },
  ];

  return (
    <Wrapper className="flex flex-row">
      <div className="w-1/2">
        {SectionHeadersConfig.map((config) => (
          <SectionHeader key={config.name} {...config} />
        ))}
        <div className="border-t-[1px] border-[#d7d7d7]" />
      </div>
      <SectionContent className="w-1/2">
        <div className="px-4">
          {(() => {
            switch (selectedTab) {
              case Tabs.General:
                return <GeneralSettings />;
              case Tabs.Theme:
                return <div>Theme settings</div>;
            }
          })()}
        </div>
      </SectionContent>
    </Wrapper>
  );
}

export default AppSettings;
