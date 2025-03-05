import React from "react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import useLatestCommit from "git/hooks/useLatestCommit";

function LatestCommitInfo() {
  const { latestCommit } = useLatestCommit();

  return (
    <LatestCommitInfoView
      authorName={latestCommit?.authorName ?? null}
      committedAt={latestCommit?.committedAt ?? null}
      hash={latestCommit?.hash ?? null}
      message={latestCommit?.message ?? null}
    />
  );
}

export default LatestCommitInfo;
