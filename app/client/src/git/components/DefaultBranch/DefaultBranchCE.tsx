import React from "react";
import DefaultBranchView from "./DefaultBranchView";
import useBranches from "git/hooks/useBranches";

export default function DefaultBranchCE() {
  const { branches } = useBranches();

  return (
    <DefaultBranchView
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}
