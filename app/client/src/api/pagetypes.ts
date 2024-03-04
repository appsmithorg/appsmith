import type { DSLWidget } from "WidgetProvider/types";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";

export type SupportedLayouts =
  | "DESKTOP"
  | "TABLET_LARGE"
  | "TABLET"
  | "MOBILE"
  | "FLUID";

export interface ClonePageActionPayload {
  id: string;
  blockNavigation?: boolean;
}

export interface CreatePageActionPayload {
  applicationId: string;
  name: string;
  layouts: Partial<PageLayout>[];
  blockNavigation?: boolean;
}

export interface PageLayout {
  id: string;
  dsl: Partial<DSLWidget>;
  layoutOnLoadActions: PageAction[][];
  layoutActions: PageAction[];
  layoutOnLoadActionErrors?: LayoutOnLoadActionErrors[];
}
