import type { NavigationSetting } from "constants/AppConstants";
import type { Page } from "entities/Page";

export interface MenuItemProps {
  page: Page;
  query: string;
  navigationSetting?: NavigationSetting;
}
