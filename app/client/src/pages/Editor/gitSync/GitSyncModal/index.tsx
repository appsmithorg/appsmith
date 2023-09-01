import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import React from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import GitSyncModalV1 from "./GitSyncModalV1";
import GitSyncModalV2 from "./GitSyncModalV2";

interface GitSyncModalProps {
  isImport?: boolean;
}

function GitSyncModal(props: GitSyncModalProps) {
  const isGitConnectV2Enabled = useFeatureFlag(
    FEATURE_FLAG.release_git_connect_v2_enabled,
  );

  return isGitConnectV2Enabled ? (
    <GitSyncModalV2 {...props} />
  ) : (
    <GitSyncModalV1 {...props} />
  );
}

export default GitSyncModal;
