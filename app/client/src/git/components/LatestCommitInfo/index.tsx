import React from "react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import usePretag from "git/hooks/usePretag";

function LatestCommitInfo() {
  const { isPretagLoading, pretagResponse } = usePretag();

  const commitHash = pretagResponse?.hash
    ? pretagResponse.hash.slice(0, 7)
    : null;

  return (
    <LatestCommitInfoView
      authorName={pretagResponse?.author.name ?? null}
      committedAt={pretagResponse?.commitedAt ?? null}
      hash={commitHash}
      isLoading={isPretagLoading}
      message={pretagResponse?.commitMessage ?? null}
    />
  );
}

export default LatestCommitInfo;
