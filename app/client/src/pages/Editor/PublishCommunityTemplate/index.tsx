import React from "react";
import BackButton from "../DataSourceEditor/BackButton";
import styled from "styled-components";
import { Text } from "design-system";
import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";

const PublishCommunityTemplate = () => {
  return (
    <>
      <HeaderContainer>
        <Header>
          <BackButton />
        </Header>
        <Text className="title" kind="heading-xl" renderAs="h1">
          {createMessage(COMMUNITY_TEMPLATES.publishForm.title)}
        </Text>
      </HeaderContainer>
      <BodyContainer>
        <h1>Rahul</h1>
      </BodyContainer>
    </>
  );
};

export default PublishCommunityTemplate;

const Header = styled.div`
  width: 100%;

  > a {
    margin: 0;
  }
`;
const defaultContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--ads-v2-spaces-7);
`;
const HeaderContainer = styled(defaultContainer)`
  border-bottom: 1px solid var(--ads-v2-color-border);
`;
const BodyContainer = styled(defaultContainer)`
  height: 100%;
`;
