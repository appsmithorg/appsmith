import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import React from "react";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import NewChangesList from "./NewChangesList";
import OldChangesList from "./OldChangesList";

export default function GitChangesList() {
  const isGitGranularFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_git_status_granular_enabled,
  );
  if (isGitGranularFeatureEnabled) {
    return <NewChangesList />;
  } else {
    return <OldChangesList />;
  }
}
