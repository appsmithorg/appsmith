import type { Page } from "@appsmith/constants/ReduxActionConstants";
import { ThemePropertyPane } from "pages/Editor/ThemePropertyPane";
import { WDSThemePropertyPane } from "pages/Editor/WDSThemePropertyPane";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAllPages } from "@appsmith/selectors/entitiesSelector";
import styled from "styled-components";
import GeneralSettings from "./GeneralSettings";
import type { SectionHeaderProps } from "./SectionHeader";
import SectionHeader from "./SectionHeader";
import DraggablePageList from "./DraggablePageList";
import PageSettings from "./PageSettings";
import { getAppSettingsPane } from "selectors/appSettingsPaneSelectors";
import {
  APP_NAVIGATION_SETTING,
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
  UPDATE_VIA_IMPORT_SETTING,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import EmbedSettings from "./EmbedSettings";
import NavigationSettings from "./NavigationSettings";
import {
  closeAppSettingsPaneAction,
  updateAppSettingsPaneSelectedTabAction,
} from "actions/appSettingsPaneActions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Divider } from "design-system";
import { ImportAppSettings } from "./ImportAppSettings";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import BetaCard from "components/editorComponents/BetaCard";

export enum AppSettingsTabs {
  General,
  Embed,
  Theme,
  Navigation,
  Page,
  Import,
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

const SectionTitle = styled.p`
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

const PageSectionTitle = styled.p`
  padding: 10px 1rem 10px 1rem;
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
`;

const ThemeContentWrapper = styled.div`
  height: calc(100% - 48px);
  overflow-y: overlay;
`;

function AppSettings() {
  const { context } = useSelector(getAppSettingsPane);
  const pages: Page[] = useSelector(selectAllPages);
  const dispatch = useDispatch();
  const isWDSEnabled = useFeatureFlag("ab_wds_enabled");

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

  useEffect(() => {
    dispatch(
      updateAppSettingsPaneSelectedTabAction({
        isOpen: true,
        context: {
          type: selectedTab.type,
        },
      }),
    );

    return () => {
      dispatch(closeAppSettingsPaneAction());
    };
  }, [selectedTab]);

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      id: "t--general-settings-header",
      icon: "settings-2-line",
      isSelected: selectedTab.type === AppSettingsTabs.General,
      name: createMessage(GENERAL_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.General });
        AnalyticsUtil.logEvent("APP_SETTINGS_SECTION_CLICK", {
          section: "General",
        });
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
        AnalyticsUtil.logEvent("APP_SETTINGS_SECTION_CLICK", {
          section: "Embed",
        });
      },
      subText: createMessage(IN_APP_EMBED_SETTING.sectionHeaderDesc),
    },
    {
      id: "t--theme-settings-header",
      icon: "pencil-line",
      isSelected: selectedTab.type === AppSettingsTabs.Theme,
      name: createMessage(THEME_SETTINGS_SECTION_HEADER),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.Theme });
        AnalyticsUtil.logEvent("APP_SETTINGS_SECTION_CLICK", {
          section: "Theme",
        });
      },
      subText: createMessage(THEME_SETTINGS_SECTION_HEADER_DESC),
    },
    {
      id: "t--navigation-settings-header",
      icon: "hamburger",
      isSelected: selectedTab.type === AppSettingsTabs.Navigation,
      name: createMessage(APP_NAVIGATION_SETTING.sectionHeader),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.Navigation });
        AnalyticsUtil.logEvent("APP_SETTINGS_SECTION_CLICK", {
          section: "Navigation",
        });
      },
      subText: createMessage(APP_NAVIGATION_SETTING.sectionHeaderDesc),
    },
    {
      id: "t--update-via-import",
      icon: "download-line",
      isSelected: selectedTab.type === AppSettingsTabs.Import,
      name: createMessage(UPDATE_VIA_IMPORT_SETTING.settingLabel),
      onClick: () => {
        setSelectedTab({ type: AppSettingsTabs.Import });
        AnalyticsUtil.logEvent("APP_SETTINGS_SECTION_CLICK", {
          section: "Import",
        });
      },
      subText: createMessage(UPDATE_VIA_IMPORT_SETTING.settingDesc),
    },
  ];

  return (
    <Wrapper className="flex flex-row">
      <div className="w-1/2">
        {SectionHeadersConfig.map((config) => (
          <SectionHeader key={config.name} {...config} />
        ))}
        <Divider />
        <PageSectionTitle>{PAGE_SETTINGS_SECTION_HEADER()}</PageSectionTitle>
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
                  <SectionTitle>
                    {GENERAL_SETTINGS_SECTION_CONTENT_HEADER()}
                  </SectionTitle>
                  <GeneralSettings />
                </div>
              );
            case AppSettingsTabs.Theme:
              return (
                <>
                  <div className="px-4">
                    <SectionTitle className="flex items-center gap-2">
                      {THEME_SETTINGS_SECTION_CONTENT_HEADER()}
                      <BetaCard />
                    </SectionTitle>
                  </div>
                  <ThemeContentWrapper>
                    {isWDSEnabled ? (
                      <WDSThemePropertyPane />
                    ) : (
                      <ThemePropertyPane />
                    )}
                  </ThemeContentWrapper>
                </>
              );
            case AppSettingsTabs.Page:
              return (
                selectedTab.page && (
                  <div className="px-4">
                    <SectionTitle>
                      {selectedTab.page.pageName +
                        " " +
                        PAGE_SETTINGS_SECTION_CONTENT_HEADER()}
                    </SectionTitle>
                    <PageSettings page={selectedTab.page} />
                  </div>
                )
              );
            case AppSettingsTabs.Embed:
              return <EmbedSettings />;
            case AppSettingsTabs.Navigation:
              return <NavigationSettings />;
            case AppSettingsTabs.Import:
              return <ImportAppSettings />;
          }
        })()}
      </SectionContent>
    </Wrapper>
  );
}

export default AppSettings;
