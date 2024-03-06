import React from "react";
import history from "utils/history";
import styled from "styled-components";

import AnalyticsUtil from "utils/AnalyticsUtil";
import SectionHeader from "pages/Editor/AppSettingsPane/AppSettings/SectionHeader";
import ImportPackageSettings from "./ImportPackageSettings";
import {
  createMessage,
  UPDATE_VIA_IMPORT_SETTING,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { useRouteMatch } from "react-router";
import { packageSettingsURL } from "@appsmith/RouteBuilder";
import type { SectionHeaderProps } from "pages/Editor/AppSettingsPane/AppSettings/SectionHeader";
import type { Page } from "@appsmith/constants/ReduxActionConstants";

export enum AppSettingsTabs {
  Import = "import",
}

export interface SelectedTab {
  type: AppSettingsTabs;
  page?: Page;
}

interface RouteMatchProps {
  tab?: AppSettingsTabs;
}

export const DEFAULT_TAB = AppSettingsTabs.Import;

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

function SettingsPane() {
  const {
    params: { tab = DEFAULT_TAB },
  } = useRouteMatch<RouteMatchProps>();

  const SectionHeadersConfig: SectionHeaderProps[] = [
    {
      id: "t--update-via-import",
      icon: "download-line",
      isSelected: tab === AppSettingsTabs.Import,
      name: createMessage(UPDATE_VIA_IMPORT_SETTING.settingLabel),
      onClick: () => {
        history.push(packageSettingsURL({ tab: AppSettingsTabs.Import }));
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
      </div>
      <SectionContent className="w-1/2">
        {(() => {
          switch (tab) {
            case AppSettingsTabs.Import:
              return <ImportPackageSettings />;
          }
        })()}
      </SectionContent>
    </Wrapper>
  );
}

export default SettingsPane;
