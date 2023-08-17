import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Switch, Text } from "design-system";
import React from "react";
import styled from "styled-components";

type Props = {
  isForkable: boolean;
  isPublic: boolean;
};

const ApplicationSettings = ({ isForkable, isPublic }: Props) => {
  return (
    <Container>
      <Text kind="heading-s" renderAs="h2">
        {createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.title,
        )}
      </Text>
      <Switch isSelected={isPublic}>
        {createMessage(
          COMMUNITY_TEMPLATES.publishFormPage.applicationSettings.publicSetting,
        )}
      </Switch>
      <Switch isSelected={isForkable}>
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
