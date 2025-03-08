import React from "react";
import { GitModals } from "pages/AppIDE/components/GitModals";
import TemplatesModal from "pages/Templates/TemplatesModal";
import ImportedApplicationSuccessModal from "pages/Editor/gitSync/ImportSuccessModal";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import SignpostingOverlay from "pages/Editor/FirstTimeUserOnboarding/Overlay";
import { PartialExportModal } from "components/editorComponents/PartialImportExport/PartialExportModal";
import { PartialImportModal } from "components/editorComponents/PartialImportExport/PartialImportModal";
import { AppCURLImportModal } from "ee/pages/Editor/CurlImport";
import GeneratePageModal from "pages/Editor/GeneratePage";

export function AppIDEModals() {
  return (
    <>
      <GitModals />
      <TemplatesModal />
      <ImportedApplicationSuccessModal />
      <ReconnectDatasourceModal />
      <SignpostingOverlay />
      <PartialExportModal />
      <PartialImportModal />
      <AppCURLImportModal />
      <GeneratePageModal />
    </>
  );
}
