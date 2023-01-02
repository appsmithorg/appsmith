import { Page } from "@appsmith/constants/ReduxActionConstants";
import { ThemePropertyPane } from "pages/Editor/ThemePropertyPane";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAllPages } from "selectors/entitiesSelector";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings";
import SectionHeader, { SectionHeaderProps } from "./SectionHeader";
import DraggablePageList from "./DraggablePageList";
import PageSettings from "./PageSettings";
import { getAppSettingsPane } from "selectors/appSettingsPaneSelectors";
import {
  createMessage,
  GENERAL_SETTINGS_SECTION_CONTENT_HEADER,
  GENERAL_SETTINGS_SECTION_HEADER,
  GENERAL_SETTINGS_SECTION_HEADER_DESC,
  IN_APP_EMBED_SETTING,
  PAGE_SETTINGS_SECTION_CONTENT_HEADER,
  PAGE_SETTINGS_SECTION_HEADER,
  THEME_SETTINGS_SECTION_CONTENT_HEADER,
  THEME_SETTINGS_SECTION_HEADER,
  THEME_SETTINGS_SECTION_HEADER_DESC,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import EmbedSettings from "./EmbedSettings";

export enum AppSettingsTabs {
  General,
  Embed,
  Theme,
  Page,
}

export interface SelectedTab {
  type: AppSettingsTabs;
  page?: Page;
}

const Wrapper = styled.div`
  height: calc(100% - 48px);
`;

const SectionContent = styled.div`
  box-shadow: -1px 0 0 0 ${Colors.GRAY_300};
  // property help label underline
  .underline {
    color: ${(props) => props.theme.colors.paneTextUnderline};
  }
`;

const ThemeContentWrapper = styled.div`
  height: calc(100% - 48px);
  overflow-y: overlay;
`;

function AppSettings() {
  const { context } = useSelector(getAppSettingsPane);
  const pages: Page[] = useSelector(selectAllPages);

  const [selectedTab, setSelectedTab] = useState<SelectedTab>({
    type: context?.type || AppSettingsTabs.General,
    page:
      context?.pageId && pages.length > 0
        ? pages.find((page) => page.pageId === context.pageId) || pages[0]
        : undefined,
  });

  useEffect(() => {
    if (selectedTab.page?.pageId && pages.length > 0) {
      setSelectedTab({
        ...selectedTab,
        page:
          pages.find((page) => page.pageId === selectedTab.page?.pageId) ||
          pages[0],
      });
    }
  }, [selectedTab.page?.pageId, pages]);

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      id: "t--general-settings-header",
      icon: "settings-2-line",
      isSelected: selectedTab.type === AppSettingsTabs.General,
      name: createMessage(GENERAL_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.General });
      },
      subText: createMessage(GENERAL_SETTINGS_SECTION_HEADER_DESC),
    },
    {
      id: "t--share-embed-settings",
      icon: "share-line",
      isSelected: selectedTab.type === AppSettingsTabs.Embed,
      name: createMessage(IN_APP_EMBED_SETTING.sectionHeader),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.Embed });
      },
      subText: createMessage(IN_APP_EMBED_SETTING.sectionHeaderDesc),
    },
    {
      id: "t--theme-settings-header",
      icon: "edit-line",
      isSelected: selectedTab.type === AppSettingsTabs.Theme,
      name: createMessage(THEME_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.Theme });
      },
      subText: createMessage(THEME_SETTINGS_SECTION_HEADER_DESC),
    },
  ];

  return (
    <Wrapper className="flex flex-row">
      <div className="w-1/2">
        {SectionHeadersConfig.map((config) => (
          <SectionHeader key={config.name} {...config} />
        ))}
        <div
          className={`border-t-[1px] border-[color:var(--appsmith-color-black-300)]`}
        />
        <div className="font-medium px-4 py-[10px]">
          {PAGE_SETTINGS_SECTION_HEADER()}
        </div>
        <DraggablePageList
          onPageSelect={(pageId: string) =>
            setSelectedTab({
              type: AppSettingsTabs.Page,
              page: pages.find((page) => page.pageId === pageId),
            })
          }
          pages={pages}
          selectedPage={selectedTab.page?.pageId}
        />
      </div>
      <SectionContent className="w-1/2">
        {(() => {
          switch (selectedTab.type) {
            case AppSettingsTabs.General:
              return (
                <div className="px-4">
                  <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
                    {GENERAL_SETTINGS_SECTION_CONTENT_HEADER()}
                  </div>
                  <GeneralSettings />
                </div>
              );
            case AppSettingsTabs.Theme:
              return (
                <>
                  <div className="px-4">
                    <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)]">
                      {THEME_SETTINGS_SECTION_CONTENT_HEADER()}
                    </div>
                  </div>
                  <ThemeContentWrapper>
                    <ThemePropertyPane />
                  </ThemeContentWrapper>
                </>
              );
            case AppSettingsTabs.Page:
              return (
                selectedTab.page && (
                  <div className="px-4">
                    <div className="pt-3 pb-2 font-medium text-[color:var(--appsmith-color-black-800)] text-ellipsis whitespace-nowrap overflow-hidden">
                      {selectedTab.page.pageName +
                        " " +
                        PAGE_SETTINGS_SECTION_CONTENT_HEADER()}
                    </div>
                    <PageSettings page={selectedTab.page} />
                  </div>
                )
              );
            case AppSettingsTabs.Embed:
              return <EmbedSettings />;
          }
        })()}
      </SectionContent>
    </Wrapper>
  );
}

export default AppSettings;
