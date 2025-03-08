import React from "react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import usePretag from "git/hooks/usePretag";

function LatestCommitInfo() {
  const { pretagResponse } = usePretag();

  const commitHash = pretagResponse?.hash
    ? pretagResponse.hash.slice(0, 7)
    : null;

  return (
    <LatestCommitInfoView
      authorName={pretagResponse?.author.name ?? null}
      committedAt={pretagResponse?.committedAt ?? null}
      hash={commitHash}
      message={pretagResponse?.message ?? null}
    />
  );
}

export default LatestCommitInfo;
