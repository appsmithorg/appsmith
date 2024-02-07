import React from "react";
import GitSyncModalV2 from "./GitSyncModalV2";

interface GitSyncModalProps {
  isImport?: boolean;
}

function GitSyncModal(props: GitSyncModalProps) {
  <GitSyncModalV2 {...props} />;
}

export default GitSyncModal;
