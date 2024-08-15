import type {
  ApplicationPayload,
  Page,
} from "ee/constants/ReduxActionConstants";

export interface NavigationProps {
  pages: Page[];
  currentApplicationDetails?: ApplicationPayload;
}
