export interface Page {
  pageName: string;
  description?: string;
  pageId: string;
  basePageId: string;
  isDefault: boolean;
  latest?: boolean;
  isHidden?: boolean;
  slug: string;
  customSlug?: string;
  userPermissions?: string[];
}
