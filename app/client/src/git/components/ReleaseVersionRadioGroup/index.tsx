import React from "react";
import ReleaseVersionRadioGroupView from "./ReleaseVersionRadioGroupView";
import noop from "lodash/noop";

interface ReleaseVersionRadioGroupProps {
  onVersionChange: (version: string | null) => void;
}

function ReleaseVersionRadioGroup({
  onVersionChange = noop,
}: ReleaseVersionRadioGroupProps) {
  const currentVersion = "4.1.2";
  const releasedAt = "2 weeks ago";

  return (
    <ReleaseVersionRadioGroupView
      currentVersion={currentVersion}
      onVersionChange={onVersionChange}
      releasedAt={releasedAt}
    />
  );
}

export default ReleaseVersionRadioGroup;
