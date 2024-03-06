import React from "react";
import UnlicensedGitCD from "ce/components/gitComponents/GitSettingsCDTab/UnlicensedGitCD";
import LicensedGitCD from "./LicensedGitCD";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

function GitSettingsCDTab() {
  const isGitCDLicensed = useFeatureFlag(
    FEATURE_FLAG.license_git_continuous_delivery_enabled,
  );

  if (!isGitCDLicensed) {
    return <UnlicensedGitCD />;
  }
  return <LicensedGitCD />;
}

export default GitSettingsCDTab;
