import React, { useCallback } from "react";
import ImportOverrideModalView from "./ImportOverrideModalView";
import useImport from "git/hooks/useImport";

function ImportOverrideModal() {
  const {
    gitImport,
    importOverrideParams,
    isImportOverrideModalOpen,
    resetImportOverrideParams,
  } = useImport();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetImportOverrideParams();
      }
    },
    [resetImportOverrideParams],
  );

  const handleImport = useCallback(() => {
    if (importOverrideParams) {
      gitImport({ ...importOverrideParams, override: true });
    }
  }, [gitImport, importOverrideParams]);

  return (
    <ImportOverrideModalView
      artifactType={"package"}
      isOpen={isImportOverrideModalOpen}
      onImport={handleImport}
      onOpenChange={handleOpenChange}
    />
  );
}

export default ImportOverrideModal;
