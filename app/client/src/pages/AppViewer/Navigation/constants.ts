import type { ApplicationPayload } from "entities/Application";
import type { Page } from "entities/Page";

export interface NavigationProps {
  pages: Page[];
  currentApplicationDetails?: ApplicationPayload;
}
