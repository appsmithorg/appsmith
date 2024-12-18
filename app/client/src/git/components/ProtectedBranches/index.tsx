import React from "react";
import ProtectedBranchesView from "./ProtectedBranchesView";
import { useGitContext } from "../GitContextProvider";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useGitFeatureFlags from "git/hooks/useGitFeatureFlags";
import useDefaultBranch from "git/ee/hooks/useDefaultBranch";

function ProtectedBranches() {
  const { branches } = useGitContext();
  const { defaultBranch } = useDefaultBranch();
  const {
    isUpdateProtectedBranchesLoading,
    protectedBranches,
    updateProtectedBranches,
  } = useProtectedBranches();
  const { license_git_branch_protection_enabled } = useGitFeatureFlags();

  return (
    <ProtectedBranchesView
      branches={branches}
      defaultBranch={defaultBranch}
      isProtectedBranchesLicensed={license_git_branch_protection_enabled}
      isUpdateProtectedBranchesLoading={isUpdateProtectedBranchesLoading}
      protectedBranches={protectedBranches}
      updateProtectedBranches={updateProtectedBranches}
    />
  );
}

export default ProtectedBranches;
