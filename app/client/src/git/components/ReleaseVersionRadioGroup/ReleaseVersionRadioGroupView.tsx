import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Radio, RadioGroup, Tag, Text } from "@appsmith/ads";
import { RELEASE_VERSION_RADIO_GROUP } from "git/ee/constants/messages";
import { inc } from "semver";
import noop from "lodash/noop";

type ReleaseType = "major" | "minor" | "patch" | null;

interface ReleaseVersionRadioGroupViewProps {
  latestReleaseVersion: string | null;
  onVersionChange: (value: string | null) => void;
  releasedAt: string | null;
}

function ReleaseVersionRadioGroupView({
  latestReleaseVersion = null,
  onVersionChange = noop,
  releasedAt = null,
}: ReleaseVersionRadioGroupViewProps) {
  const [releaseType, setReleaseType] = useState<ReleaseType>("patch");

  const nextVersion = useMemo(() => {
    if (!releaseType) return null;

    return inc(latestReleaseVersion ?? "0.0.0", releaseType);
  }, [latestReleaseVersion, releaseType]);

  useEffect(
    function releaseVersionChangeEffect() {
      onVersionChange(nextVersion);
    },
    [nextVersion, onVersionChange],
  );

  const handleRadioChange = useCallback((value: string) => {
    setReleaseType(value as ReleaseType);
  }, []);

  return (
    <Flex flexDirection="column" gap="spaces-2" marginBottom="spaces-4">
      <Text data-testid="t--git-release-version-title" renderAs="p">
        {RELEASE_VERSION_RADIO_GROUP.TITLE}
      </Text>
      <Flex alignItems="center" gap="spaces-4">
        <Flex minWidth="40px">
          <Tag
            data-testid="t--git-release-next-version"
            isClosable={false}
            kind="neutral"
          >
            {nextVersion ?? "-"}
          </Tag>
        </Flex>
        <RadioGroup
          UNSAFE_gap="var(--ads-v2-spaces-4)"
          onChange={handleRadioChange}
          orientation="horizontal"
          value={releaseType ?? undefined}
        >
          <Radio value="major">Major</Radio>
          <Radio value="minor">Minor</Radio>
          <Radio value="patch">Patch</Radio>
        </RadioGroup>
      </Flex>
      {latestReleaseVersion && (
        <Text
          data-testid="t--git-release-released-at"
          kind="body-s"
          renderAs="p"
        >
          {RELEASE_VERSION_RADIO_GROUP.LAST_RELEASED}:{" "}
          {latestReleaseVersion ?? "-"} ({releasedAt ?? "-"})
        </Text>
      )}
    </Flex>
  );
}

export default ReleaseVersionRadioGroupView;
