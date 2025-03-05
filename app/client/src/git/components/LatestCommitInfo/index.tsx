import React from "react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import usePretag from "git/hooks/usePretag";

function LatestCommitInfo() {
  const { pretagResponse } = usePretag();

  return (
    <LatestCommitInfoView
      authorName={pretagResponse?.author.name ?? null}
      committedAt={pretagResponse?.committedAt ?? null}
      hash={pretagResponse?.hash ?? null}
      message={pretagResponse?.message ?? null}
    />
  );
}

export default LatestCommitInfo;
