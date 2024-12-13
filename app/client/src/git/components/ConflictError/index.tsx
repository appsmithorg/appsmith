import React from "react";

import { useGitContext } from "../GitContextProvider";
import GitConflictErrorView from "./ConflictErrorView";

export default function ConflictError() {
  const { gitMetadata } = useGitContext();

  // ! case: learnMoreUrl comes from pullError
  const learnMoreUrl =
    "https://docs.appsmith.com/advanced-concepts/version-control-with-git";
  const repoUrl = gitMetadata?.browserSupportedRemoteUrl || "";

  return <GitConflictErrorView learnMoreUrl={learnMoreUrl} repoUrl={repoUrl} />;
}
