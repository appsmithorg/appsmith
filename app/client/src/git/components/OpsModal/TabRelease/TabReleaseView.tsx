import { Button, ModalBody, ModalFooter, Text } from "@appsmith/ads";
import LatestCommitInfo from "git/components/LatestCommitInfo";
import ReleaseNotesInput from "git/components/ReleaseNotesInput";
import ReleaseVersionRadioGroup from "git/components/ReleaseVersionRadioGroup";
import { TAB_RELEASE } from "git/ee/constants/messages";
import noop from "lodash/noop";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  min-height: 360px;
  overflow: unset;
  padding-bottom: 4px;
`;

const TabTitle = styled(Text)`
  margin-bottom: 12px;
  color: var(--ads-v2-color-fg-emphasis);
`;

const StyledModalFooter = styled(ModalFooter)`
  min-height: 52px;
`;

interface TabReleaseProps {
  fetchPretag: () => void;
  createReleaseTag: (params: {
    tag: string;
    releaseNote: string;
    commitSHA: string;
  }) => void;
  isCreateReleaseTagLoading: boolean;
  latestCommitSHA: string | null;
}

function TabReleaseView({
  createReleaseTag = noop,
  fetchPretag = noop,
  isCreateReleaseTagLoading = false,
  latestCommitSHA = null,
}: TabReleaseProps) {
  const [releaseVersion, setReleaseVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);

  const isReleaseDisabled = !releaseVersion;

  useEffect(
    function fetchPretagOnInitEffect() {
      fetchPretag();
    },
    [fetchPretag],
  );

  const handleClickOnRelease = useCallback(() => {
    createReleaseTag({
      tag: releaseVersion ?? "",
      releaseNote: releaseNotes ?? "",
      commitSHA: latestCommitSHA ?? "",
    });
  }, [createReleaseTag, latestCommitSHA, releaseNotes, releaseVersion]);

  return (
    <>
      <ModalBody>
        <Container>
          <TabTitle kind="heading-s" renderAs="p">
            {TAB_RELEASE.TITLE}
          </TabTitle>
          <LatestCommitInfo />
          <ReleaseVersionRadioGroup onVersionChange={setReleaseVersion} />
          <ReleaseNotesInput
            onTextChange={setReleaseNotes}
            text={releaseNotes}
          />
        </Container>
      </ModalBody>
      <StyledModalFooter>
        <Button
          isDisabled={isReleaseDisabled}
          isLoading={isCreateReleaseTagLoading}
          onClick={handleClickOnRelease}
          size="md"
        >
          {TAB_RELEASE.RELEASE_BTN}
        </Button>
      </StyledModalFooter>
    </>
  );
}

export default TabReleaseView;
