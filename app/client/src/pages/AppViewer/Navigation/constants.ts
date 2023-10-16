import type {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";

export interface NavigationProps {
  pages: Page[];
  currentApplicationDetails?: ApplicationPayload;
}
