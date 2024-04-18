import * as Factory from "factory.ts";
import type { Page } from "@appsmith/constants/ReduxActionConstants";

export const PageFactory = Factory.Sync.makeFactory<Page>({
  pageName: Factory.each((i) => `Page${i + 1}`),
  pageId: Factory.each((i) => `page_id_${i + 1}`),
  isDefault: false,
  isHidden: false,
  slug: Factory.each((i) => `pageSlug${i + 1}`),
  userPermissions: [
    "read:pages",
    "manage:pages",
    "create:pageActions",
    "delete:pages",
  ],
});
