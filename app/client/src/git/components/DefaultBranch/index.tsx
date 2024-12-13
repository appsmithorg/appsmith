import React from "react";
import useGitFeatureFlags from "git/hooks/useGitFeatureFlags";
import DefaultBranchEE from "ee/git/components/DefaultBranch";
import DefaultBranchCE from "./DefaultBranchCE";

function DefaultBranch() {
  const { license_git_branch_protection_enabled } = useGitFeatureFlags();

  if (license_git_branch_protection_enabled) {
    return <DefaultBranchEE />;
  }

  return <DefaultBranchCE />;
}

export default DefaultBranch;
