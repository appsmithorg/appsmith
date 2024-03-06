export * from "ce/pages/Applications/EmbedSnippetTab";
import { getAppsmithConfigs } from "@appsmith/configs";
import {
  default as CE_EmbedSnippetTab,
  AppSettings,
  ShareModal,
} from "ce/pages/Applications/EmbedSnippetTab";
import React from "react";

const { cloudHosting } = getAppsmithConfigs();

export function EmbedSnippetTab({
  isAppSettings,
}: {
  isAppSettings?: boolean;
}) {
  if (isAppSettings) return <AppSettings />;

  return <ShareModal />;
}

export default cloudHosting ? CE_EmbedSnippetTab : EmbedSnippetTab;
