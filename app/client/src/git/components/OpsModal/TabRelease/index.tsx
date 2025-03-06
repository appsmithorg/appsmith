import React from "react";
import TabReleaseView from "./TabReleaseView";
import usePretag from "git/hooks/usePretag";
import useReleaseTag from "git/hooks/useReleaseTag";

function TabRelease() {
  const { fetchPretag, pretagResponse } = usePretag();
  const { createReleaseTag, isCreateReleaseTagLoading } = useReleaseTag();

  const latestCommitSHA = pretagResponse?.hash ?? null;

  return (
    <TabReleaseView
      createReleaseTag={createReleaseTag}
      fetchPretag={fetchPretag}
      isCreateReleaseTagLoading={isCreateReleaseTagLoading}
      latestCommitSHA={latestCommitSHA}
    />
  );
}

export default TabRelease;
