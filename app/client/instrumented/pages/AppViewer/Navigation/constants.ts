import type {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";

export type NavigationProps = {
  pages: Page[];
  currentApplicationDetails?: ApplicationPayload;
};
