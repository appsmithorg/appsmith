import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Radio, RadioGroup, Tag, Text } from "@appsmith/ads";
import { RELEASE_VERSION_RADIO_GROUP } from "git/ee/constants/messages";
import { inc } from "semver";
import noop from "lodash/noop";

type ReleaseType = "major" | "minor" | "patch" | null;

interface ReleaseVersionRadioGroupViewProps {
  currentVersion: string | null;
  onVersionChange: (value: string | null) => void;
  releasedAt: string | null;
}

function ReleaseVersionRadioGroupView({
  currentVersion = null,
  onVersionChange = noop,
  releasedAt = null,
}: ReleaseVersionRadioGroupViewProps) {
  const [releaseType, setReleaseType] = useState<ReleaseType>("patch");

  const nextVersion = useMemo(() => {
    if (!currentVersion || !releaseType) return null;

    return inc(currentVersion, releaseType);
  }, [currentVersion, releaseType]);

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
      <Text renderAs="p">{RELEASE_VERSION_RADIO_GROUP.TITLE}</Text>
      <Flex alignItems="center" gap="spaces-4">
        <Flex minWidth="40px">
          <Tag isClosable={false} kind="neutral">
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
      <Text kind="body-s" renderAs="p">
        {RELEASE_VERSION_RADIO_GROUP.LAST_RELEASED}: {currentVersion ?? "-"} (
        {releasedAt ?? "-"})
      </Text>
    </Flex>
  );
}

export default ReleaseVersionRadioGroupView;
