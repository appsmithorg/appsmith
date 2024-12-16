import React from "react";
import { useGitContext } from "git/components/GitContextProvider";
import DefaultBranchView from "./DefaultBranchView";

export default function DefaultBranch() {
  const { branches } = useGitContext();

  return (
    <DefaultBranchView
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}
