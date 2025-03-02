import React from "react";
import LatestCommitInfoView from "./LatestCommitInfoView";

function LatestCommitInfo() {
  return (
    <LatestCommitInfoView
      authorName="John Doe"
      committedAt="2 days ago"
      hash="a3e9967"
      message="Fix package resolution issue when transferring apps across workspaces"
    />
  );
}

export default LatestCommitInfo;
