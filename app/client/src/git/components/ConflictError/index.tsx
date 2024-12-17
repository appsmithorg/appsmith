import React from "react";

import GitConflictErrorView from "./ConflictErrorView";
import useMetadata from "git/hooks/useMetadata";

export default function ConflictError() {
  const { metadata } = useMetadata();

  // ! case: learnMoreUrl comes from pullError
  const learnMoreUrl =
    "https://docs.appsmith.com/advanced-concepts/version-control-with-git";
  const repoUrl = metadata?.browserSupportedRemoteUrl || "";

  return <GitConflictErrorView learnMoreUrl={learnMoreUrl} repoUrl={repoUrl} />;
}
