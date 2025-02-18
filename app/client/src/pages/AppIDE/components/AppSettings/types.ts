import type { NavigationSetting } from "constants/AppConstants";

export type UpdateSetting = (
  key: keyof NavigationSetting,
  value: NavigationSetting[keyof NavigationSetting],
) => void;

export interface LogoConfigurationSwitches {
  logo: boolean;
  applicationTitle: boolean;
}
