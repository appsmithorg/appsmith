import type { Page } from "entities/Page";
import * as Factory from "factory.ts";

function generateRandomHexId() {
  const hexChars = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) {
    id += hexChars[Math.floor(Math.random() * 16)];
  }
  return id;
}

export const PageFactory = Factory.Sync.makeFactory<Page>({
  pageName: Factory.each((i) => `Page${i + 1}`),
  pageId: Factory.each(() => generateRandomHexId()),
  basePageId: Factory.each(() => generateRandomHexId()),
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
