import React from "react";
import TabReleaseView from "./TabReleaseView";
import usePretag from "git/hooks/usePretag";

function TabRelease() {
  const { fetchPretag } = usePretag();

  return <TabReleaseView fetchPretag={fetchPretag} />;
}

export default TabRelease;
