import React from "react";
import DefaultBranchView from "./DefaultBranchView";
import { useGitContext } from "../GitContextProvider";

export default function DefaultBranchCE() {
  const { branches } = useGitContext();

  return (
    <DefaultBranchView
      branches={branches}
      isGitProtectedFeatureLicensed={false}
    />
  );
}
