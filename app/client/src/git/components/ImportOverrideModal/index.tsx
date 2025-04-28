import React, { useCallback } from "react";
import ImportOverrideModalView from "./ImportOverrideModalView";
import useImport from "git/hooks/useImport";

function ImportOverrideModal() {
  const {
    gitImport,
    importOverrideDetails,
    isGitImportLoading,
    isImportOverrideModalOpen,
    resetGitImport,
    resetImportOverrideDetails,
  } = useImport();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isGitImportLoading) {
        resetImportOverrideDetails();
        resetGitImport();
      }
    },
    [isGitImportLoading, resetGitImport, resetImportOverrideDetails],
  );

  const handleImport = useCallback(() => {
    if (importOverrideDetails) {
      const params = { ...importOverrideDetails.params, override: true };

      gitImport(params);
    }
  }, [gitImport, importOverrideDetails]);

  return (
    <ImportOverrideModalView
      artifactType={"package"}
      isImportLoading={isGitImportLoading}
      isOpen={isImportOverrideModalOpen}
      newArtifactName={importOverrideDetails?.newArtifactName ?? null}
      oldArtifactName={importOverrideDetails?.oldArtifactName ?? null}
      onImport={handleImport}
      onOpenChange={handleOpenChange}
    />
  );
}

export default ImportOverrideModal;
