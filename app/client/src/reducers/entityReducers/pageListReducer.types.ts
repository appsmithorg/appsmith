import type { Page } from "entities/Page/types";
import type { DSL } from "reducers/uiReducers/pageCanvasStructureReducer";

export type SupportedLayouts =
  | "DESKTOP"
  | "TABLET_LARGE"
  | "TABLET"
  | "MOBILE"
  | "FLUID";

export interface AppLayoutConfig {
  type: SupportedLayouts;
}

export interface GeneratePageModalParams {
  datasourceId?: string;
  new_page?: boolean;
}

export interface PageListReduxState {
  pages: Page[];
  baseApplicationId: string;
  applicationId: string;
  currentBasePageId: string;
  currentPageId: string;
  defaultBasePageId: string;
  defaultPageId: string;
  appLayout?: AppLayoutConfig;
  isGeneratingTemplatePage?: boolean;
  generatePage?: {
    modalOpen: boolean;
    params?: GeneratePageModalParams;
  };
  loading: Record<string, boolean>;
}

// Re-export for backward compatibility
export type { Page, DSL };
