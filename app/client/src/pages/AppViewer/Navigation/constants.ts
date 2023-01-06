import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";

export type NavigationProps = {
  appPages: Page[];
  currentApplicationDetails?: ApplicationPayload;
  measuredTabsRef: (ref: HTMLElement | null) => void;
  tabsScrollable: boolean;
  setShowScrollArrows: () => void;
};
