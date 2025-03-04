import { Button, ModalBody, ModalFooter, Text } from "@appsmith/ads";
import LatestCommitInfo from "git/components/LatestCommitInfo";
import ReleaseNotesInput from "git/components/ReleaseNotesInput";
import ReleaseVersionRadioGroup from "git/components/ReleaseVersionRadioGroup";
import { TAB_RELEASE } from "git/ee/constants/messages";
import React, { useCallback, useState } from "react";
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

function TabRelease() {
  const [releaseVersion, setReleaseVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);

  const isReleaseDisabled = !releaseVersion || !releaseNotes;

  const handleClickOnRelease = useCallback(() => {}, []);

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
          onClick={handleClickOnRelease}
          size="md"
        >
          {TAB_RELEASE.RELEASE_BTN}
        </Button>
      </StyledModalFooter>
    </>
  );
}

export default TabRelease;
