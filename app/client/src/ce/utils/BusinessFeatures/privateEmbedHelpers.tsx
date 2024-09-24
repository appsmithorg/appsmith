/* eslint-disable @typescript-eslint/no-restricted-imports */
import CE_EmbedSnippetTab from "ce/pages/Applications/EmbedSnippetTab";
import EE_EmbedSnippetTab from "ee/pages/Applications/EmbedSnippetTab";

import CE_EmbedSnippetForm from "ce/pages/Applications/EmbedSnippetTab";
import EE_EmbedSnippetForm from "ee/pages/Applications/EmbedSnippetTab";

import React from "react";

export function getEmbedSnippetTab(isEnabled: boolean) {
  if (isEnabled) {
    return <EE_EmbedSnippetTab isAppSettings />;
  } else return <CE_EmbedSnippetTab isAppSettings />;
}

export function getEmbedSnippetForm(
  isEnabled: boolean,
  setActiveTab: (tab: string) => void,
) {
  if (isEnabled) {
    return <EE_EmbedSnippetForm changeTab={() => setActiveTab("invite")} />;
  } else {
    return <CE_EmbedSnippetForm changeTab={() => setActiveTab("invite")} />;
  }
}
