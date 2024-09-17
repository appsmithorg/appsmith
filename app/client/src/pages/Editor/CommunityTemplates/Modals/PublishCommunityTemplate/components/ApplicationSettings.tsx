import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import { Switch, Text } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

interface Props {
  isForkable: boolean;
  isPublic: boolean;
  setIsForkable: (isForkable: boolean) => void;
  setIsPublic: (isForkable: boolean) => void;
}

const ApplicationSettings = ({
  isForkable,
  isPublic,
  setIsForkable,
  setIsPublic,
}: Props) => {
  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.title,
        )}
      </Text>
      <Switch
        data-testid="t--community-template-app-settting-public-switch"
        isDisabled
        isSelected={isPublic}
        onChange={setIsPublic}
      >
        {createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.publicSetting,
        )}
      </Switch>
      <Switch
        data-testid="t--community-template-app-settting-forkable-switch"
        isDisabled
        isSelected={isForkable}
        onChange={setIsForkable}
      >
        {createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.applicationSettings
            .forkableSetting,
        )}
      </Switch>
    </Container>
  );
};

export default ApplicationSettings;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
