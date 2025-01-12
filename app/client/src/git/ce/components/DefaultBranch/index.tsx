import React from "react";
import DefaultBranchView from "./DefaultBranchView";
import useBranches from "git/hooks/useBranches";

export default function DefaultBranch() {
  const { branches } = useBranches();

  return (
    <DefaultBranchView
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}
