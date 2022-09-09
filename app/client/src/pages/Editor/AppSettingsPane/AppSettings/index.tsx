import { Page } from "ce/constants/ReduxActionConstants";
import { ThemePropertyPane } from "pages/Editor/ThemePropertyPane";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectAllPages } from "selectors/entitiesSelector";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings";
import SectionHeader, { SectionHeaderProps } from "./SectionHeader";
import DraggablePageList from "./DraggablePageList";
import PageSettings from "./PageSettings";

enum Tabs {
  General,
  Theme,
  Page,
}

interface SelectedTab {
  type: Tabs;
  page?: Page;
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

const SectionContent = styled.div`
  box-shadow: -1px 0 0 0 #e0dede;
`;

const TabHeaderText = styled.div`
  height: 48px;
`;

const ThemeTabContentWrapper = styled.div`
  height: calc(100% - 48px);
  overflow-y: overlay;
`;

function AppSettings() {
  const [selectedTab, setSelectedTab] = useState<SelectedTab>();
  const pages: Page[] = useSelector(selectAllPages);

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      icon: "settings-2-line",
      isSelected: selectedTab?.type === Tabs.General,
      name: "General",
      onClick: () => {
        setSelectedTab({ type: Tabs.General });
      },
      subText: "App name, icon , share",
    },
    {
      icon: "edit-line",
      isSelected: selectedTab?.type === Tabs.Theme,
      name: "Theme",
      onClick: () => {
        setSelectedTab({ type: Tabs.Theme });
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
        <TabHeaderText className="leading-[3rem] font-medium px-4">
          Page settings
        </TabHeaderText>
        <DraggablePageList
          onPageSelect={(pageId: string) =>
            setSelectedTab({
              type: Tabs.Page,
              page: pages.find((page) => page.pageId === pageId),
            })
          }
          pages={pages}
          selectedPage={selectedTab?.page?.pageId}
        />
      </div>
      <SectionContent className="w-1/2">
        {(() => {
          switch (selectedTab?.type) {
            default:
              setSelectedTab({ type: Tabs.General });
              break;
            case Tabs.General:
              return (
                <div className="px-4">
                  <TabHeaderText className="leading-[3rem] font-medium">
                    General settings
                  </TabHeaderText>
                  <GeneralSettings />
                </div>
              );
            case Tabs.Theme:
              return (
                <>
                  <div className="px-4">
                    <TabHeaderText className="leading-[3rem] font-medium">
                      Theme settings
                    </TabHeaderText>
                  </div>
                  <ThemeTabContentWrapper>
                    <ThemePropertyPane />
                  </ThemeTabContentWrapper>
                </>
              );
            case Tabs.Page:
              return selectedTab.page ? (
                <div className="px-4">
                  <TabHeaderText className="leading-[3rem] font-medium">
                    Page settings
                  </TabHeaderText>
                  <PageSettings page={selectedTab.page} />
                </div>
              ) : (
                <div>Page not found</div>
              );
          }
        })()}
      </SectionContent>
    </Wrapper>
  );
}

export default AppSettings;
