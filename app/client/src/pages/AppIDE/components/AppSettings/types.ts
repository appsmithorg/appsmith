import type { NavigationSetting } from "constants/AppConstants";
import type { Page } from "entities/Page";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

export interface LogoConfigurationSwitches {
  logo: boolean;
  applicationTitle: boolean;
}

export enum AppSettingsTabs {
  General,
  Embed,
  Theme,
  Navigation,
  Page,
  Import,
  /** A section added by another edition. See `SelectedTab.editionSectionId`. */
  Edition,
}

export interface SelectedTab {
  type: AppSettingsTabs;
  page?: Page;
  /** Tells edition sections apart when `type` is `AppSettingsTabs.Edition`. */
  editionSectionId?: string;
}
