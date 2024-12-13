import React from "react";
import DumbGitDefaultBranch from "./DumbGitDefaultBranch";
import { useGitContext } from "../GitContextProvider";
import useGitFeatureFlags from "git/hooks/useGitFeatureFlags";
import { GitDefaultBranchEE } from "ee/git/components/GitDefaultBranch";

export function GitDefaultBranchCE() {
  const { branches } = useGitContext();

  return (
    <DumbGitDefaultBranch
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}

function GitDefaultBranch() {
  const { license_git_branch_protection_enabled } = useGitFeatureFlags();

  if (license_git_branch_protection_enabled) {
    return <GitDefaultBranchEE />;
  }

  return <GitDefaultBranchCE />;
}

export default GitDefaultBranch;
