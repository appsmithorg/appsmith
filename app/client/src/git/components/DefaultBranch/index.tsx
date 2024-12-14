import React from "react";
import useGitFeatureFlags from "git/hooks/useGitFeatureFlags";
import DefaultBranchCE from "./DefaultBranchCE";
import DefaultBranchEE from "ee/git/components/DefaultBranch/DefaultBranchEE";

function DefaultBranch() {
  const { license_git_branch_protection_enabled } = useGitFeatureFlags();

  if (license_git_branch_protection_enabled) {
    return <DefaultBranchEE />;
  }

  return <DefaultBranchCE />;
}

export default DefaultBranch;
