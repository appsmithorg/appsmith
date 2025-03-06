import React from "react";
import ReleaseVersionRadioGroupView from "./ReleaseVersionRadioGroupView";
import noop from "lodash/noop";
import useLatestCommit from "git/hooks/useLatestCommit";

interface ReleaseVersionRadioGroupProps {
  onVersionChange: (version: string | null) => void;
}

function ReleaseVersionRadioGroup({
  onVersionChange = noop,
}: ReleaseVersionRadioGroupProps) {
  const { latestCommit } = useLatestCommit();

  return (
    <ReleaseVersionRadioGroupView
      currentVersion={latestCommit?.releaseTagName ?? null}
      onVersionChange={onVersionChange}
      releasedAt={latestCommit?.releasedAt ?? null}
    />
  );
}

export default ReleaseVersionRadioGroup;
