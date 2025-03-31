import React from "react";
import ReleaseVersionRadioGroupView from "./ReleaseVersionRadioGroupView";
import noop from "lodash/noop";
import usePretag from "git/hooks/usePretag";

interface ReleaseVersionRadioGroupProps {
  onVersionChange: (version: string | null) => void;
}

function ReleaseVersionRadioGroup({
  onVersionChange = noop,
}: ReleaseVersionRadioGroupProps) {
  const { pretagResponse } = usePretag();

  return (
    <ReleaseVersionRadioGroupView
      latestReleaseVersion={pretagResponse?.releaseTagName ?? null}
      onVersionChange={onVersionChange}
    />
  );
}

export default ReleaseVersionRadioGroup;
