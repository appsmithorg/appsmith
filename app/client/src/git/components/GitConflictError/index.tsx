import React from "react";

import { useGitContext } from "../GitContextProvider";
import DumbGitConflictError from "./DumbGitConflictError";

export default function GitConflictError() {
  const { gitMetadata } = useGitContext();

  // ! case: learnMoreUrl comes from pullError
  const learnMoreUrl =
    "https://docs.appsmith.com/advanced-concepts/version-control-with-git";
  const repoUrl = gitMetadata?.browserSupportedRemoteUrl || "";

  return <DumbGitConflictError learnMoreUrl={learnMoreUrl} repoUrl={repoUrl} />;
}
