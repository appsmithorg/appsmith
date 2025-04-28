import React, { useCallback, useMemo } from "react";
import ImportOverrideModalView from "./ImportOverrideModalView";
import useImport from "git/hooks/useImport";

function ImportOverrideModal() {
  const {
    gitImport,
    gitImportError,
    importOverrideParams,
    isGitImportLoading,
    isImportOverrideModalOpen,
    resetGitImport,
    resetImportOverrideParams,
  } = useImport();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isGitImportLoading) {
        resetImportOverrideParams();
        resetGitImport();
      }
    },
    [isGitImportLoading, resetGitImport, resetImportOverrideParams],
  );

  const handleImport = useCallback(() => {
    if (importOverrideParams) {
      gitImport({ ...importOverrideParams, override: true });
    }
  }, [gitImport, importOverrideParams]);

  const { newArtifactName, oldArtifactName } = useMemo(() => {
    let artifactNames = { newArtifactName: null, oldArtifactName: null };

    if (gitImportError?.message) {
      const jsonMatch = gitImportError.message.match(/\{.*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : null;

      if (jsonStr) {
        try {
          artifactNames = JSON.parse(jsonStr);
        } catch {}
      }
    }

    return artifactNames;
  }, [gitImportError]);

  return (
    <ImportOverrideModalView
      artifactType={"package"}
      isImportLoading={isGitImportLoading}
      isOpen={isImportOverrideModalOpen}
      newArtifactName={newArtifactName}
      oldArtifactName={oldArtifactName}
      onImport={handleImport}
      onOpenChange={handleOpenChange}
    />
  );
}

export default ImportOverrideModal;
