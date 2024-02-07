import React from "react";
import GitSyncModalV2 from "./GitSyncModalV2";

interface GitSyncModalProps {
  isImport?: boolean;
}

function GitSyncModal(props: GitSyncModalProps) {
  return <GitSyncModalV2 {...props} />;
}

export default GitSyncModal;
