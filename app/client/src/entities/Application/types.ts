import type { AppLayoutConfig } from "reducers/entityReducers/pageListReducer";
import type { ApplicationVersion } from "ee/actions/applicationActions";
import type { LayoutSystemTypeConfig } from "layoutSystems/types";
import type { NavigationSetting, ThemeSetting } from "constants/AppConstants";
import type { EvaluationVersion } from "constants/EvalConstants";
import type {
  AppEmbedSetting,
  ApplicationPagePayload,
  GitApplicationMetadata,
} from "ee/api/ApplicationApi";

export interface ApplicationPayload {
  id: string;
  baseId: string;
  name: string;
  color?: string;
  icon?: string;
  workspaceId: string;
  defaultPageId: string;
  defaultBasePageId: string;
  isPublic?: boolean;
  userPermissions?: string[];
  appIsExample: boolean;
  slug: string;
  forkingEnabled?: boolean;
  appLayout?: AppLayoutConfig;
  gitApplicationMetadata?: GitApplicationMetadata;
  lastDeployedAt?: string;
  applicationId?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  pages: ApplicationPagePayload[];
  applicationVersion: ApplicationVersion;
  isAutoUpdate?: boolean;
  isManualUpdate?: boolean;
  embedSetting?: AppEmbedSetting;
  applicationDetail?: {
    appPositioning?: LayoutSystemTypeConfig;
    navigationSetting?: NavigationSetting;
    themeSetting?: ThemeSetting;
  };
  collapseInvisibleWidgets?: boolean;
  evaluationVersion?: EvaluationVersion;
  isPublishingAppToCommunityTemplate?: boolean;
  isCommunityTemplate?: boolean;
  publishedAppToCommunityTemplate?: boolean;
  forkedFromTemplateTitle?: string;
}
