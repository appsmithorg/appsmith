import type { PageTrackingMetadata } from "ee/entities/CustomerTracking";
export interface Page extends PageTrackingMetadata {
  pageName: string;
  description?: string;
  pageId: string;
  basePageId: string;
  isDefault: boolean;
  latest?: boolean;
  isHidden?: boolean;
  slug: string;
  customSlug?: string;
  uniqueSlug?: string;
  userPermissions?: string[];
}
