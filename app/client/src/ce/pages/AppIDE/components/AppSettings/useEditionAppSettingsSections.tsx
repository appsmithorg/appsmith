import type React from "react";
import type { SectionHeaderProps } from "IDE/Components/SectionHeader";
import type { SelectedTab } from "pages/AppIDE/components/AppSettings/types";

export interface EditionAppSettingsSectionsParams {
  selectedTab: SelectedTab;
  setSelectedTab: (tab: SelectedTab) => void;
}

export interface EditionAppSettingsSections {
  /** Extra section headers, added after the built-in ones. */
  headers: SectionHeaderProps[];
  /**
   * Renders the content for a tab of type `AppSettingsTabs.Edition`.
   * `tab.editionSectionId` tells sections apart. Returns null for an
   * unknown section.
   */
  renderSection: (tab: SelectedTab) => React.ReactNode | null;
}

const NO_SECTIONS: EditionAppSettingsSections = {
  headers: [],
  renderSection: () => null,
};

/**
 * Extension point for edition-specific sections in the app settings pane.
 * The community edition adds no sections. Another edition can replace the
 * file at `ee/pages/AppIDE/components/AppSettings/useEditionAppSettingsSections`.
 */
export function useEditionAppSettingsSections(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _params: EditionAppSettingsSectionsParams,
): EditionAppSettingsSections {
  return NO_SECTIONS;
}

export default useEditionAppSettingsSections;
