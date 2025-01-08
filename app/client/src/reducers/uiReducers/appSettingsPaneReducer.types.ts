import { AppSettingsTabs } from "../../pages/Editor/AppSettingsPane/AppSettings";

export interface AppSettingsPaneContext {
  type: AppSettingsTabs;
  pageId?: string;
}

export interface AppSettingsPaneReduxState {
  isOpen: boolean;
  context?: AppSettingsPaneContext;
}
