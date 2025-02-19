import React from "react";
import DefaultBranchView from "./DefaultBranchView";
import useBranches from "git/hooks/useBranches";
import { useGitContext } from "git/components/GitContextProvider";

export default function DefaultBranch() {
  const { artifactDef } = useGitContext();
  const { branches } = useBranches();
  const { artifactType } = artifactDef ?? {};

  return (
    <DefaultBranchView
      artifactType={artifactType ?? null}
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}
