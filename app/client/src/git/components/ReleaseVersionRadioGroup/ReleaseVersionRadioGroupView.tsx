import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Icon, Radio, RadioGroup, Tag, Text } from "@appsmith/ads";
import { RELEASE_VERSION_RADIO_GROUP } from "git/ee/constants/messages";
import { inc } from "semver";
import noop from "lodash/noop";
import styled from "styled-components";

const TitleText = styled(Text)`
  font-weight: 500;
`;

const CurrentVersionTag = styled(Tag)`
  border-color: var(--ads-v2-color-gray-300);
`;

const NextVersionTag = styled(Tag)`
  background-color: var(--ads-v2-color-purple-100);
  border-color: var(--ads-v2-color-purple-300);
`;

type ReleaseType = "major" | "minor" | "patch" | null;

interface ReleaseVersionRadioGroupViewProps {
  latestReleaseVersion: string | null;
  onVersionChange: (value: string | null) => void;
}

function ReleaseVersionRadioGroupView({
  latestReleaseVersion = null,
  onVersionChange = noop,
}: ReleaseVersionRadioGroupViewProps) {
  const [releaseType, setReleaseType] = useState<ReleaseType>("patch");

  const nextVersion = useMemo(() => {
    if (!releaseType) return null;

    const latestReleaseVersionVal = latestReleaseVersion
      ? latestReleaseVersion.slice(1)
      : "0.0.0";
    const nextReleaseVersionVal = inc(latestReleaseVersionVal, releaseType);

    return `v${nextReleaseVersionVal}`;
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
    <Flex flexDirection="column" gap="spaces-3" marginBottom="spaces-4">
      <TitleText data-testid="t--git-release-version-title" renderAs="p">
        {RELEASE_VERSION_RADIO_GROUP.TITLE}
      </TitleText>
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
      <Flex gap="spaces-2">
        {latestReleaseVersion && (
          <CurrentVersionTag
            data-testid="t--git-release-current-version"
            isClosable={false}
            kind="neutral"
          >
            {latestReleaseVersion}
          </CurrentVersionTag>
        )}
        {latestReleaseVersion && nextVersion && (
          <Icon name="arrow-right-line" size="sm" />
        )}
        <NextVersionTag
          color="var(--ads-v2-color-purple-100)"
          data-testid="t--git-release-next-version"
          isClosable={false}
          kind="neutral"
        >
          {nextVersion ?? "-"}
        </NextVersionTag>
      </Flex>
    </Flex>
  );
}

export default ReleaseVersionRadioGroupView;
