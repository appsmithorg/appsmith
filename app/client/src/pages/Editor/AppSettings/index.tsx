import React, { useState } from "react";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings/GeneralSettings";
import GeneralSettingsHeader from "./GeneralSettings/GeneralSettingsHeader";

interface AppSettingsProps {
  className?: string;
}

enum Tabs {
  General,
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
          <GeneralSettingsHeader />
        </div>
      </div>
      <TabContentContainer className="basis-1/2">
        {(() => {
          switch (selectedTab) {
            case Tabs.General:
              return <GeneralSettings />;
          }
        })()}
      </TabContentContainer>
    </Wrapper>
  );
}

export default AppSettings;
