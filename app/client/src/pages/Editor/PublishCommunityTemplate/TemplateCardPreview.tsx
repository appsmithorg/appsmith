import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Text } from "design-system";
import ProfileImage from "pages/common/ProfileImage";
import React from "react";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import styled from "styled-components";

type Props = {
  excerpt: string;
  templateName: string;
  useCases: string[];
};

const TemplateCardPreview = ({ excerpt, templateName, useCases }: Props) => {
  return (
    <CardContainer>
      <ImgPreviewContainer>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.publishForm.preview.thumbnail)}
        </Text>
      </ImgPreviewContainer>
      <Text kind="heading-m" renderAs="h2">
        {templateName}
      </Text>
      <Text className="strong" kind="body-m" renderAs="p">
        {useCases.join(" • ")}
      </Text>
      <Text className="excerpt" kind="body-m" renderAs="p">
        {excerpt}
      </Text>
      <UserProfile />
    </CardContainer>
  );
};

export default TemplateCardPreview;

const UserProfile = () => {
  const currentUser = useSelector(getCurrentUser);

  return (
    <ProfileContainer>
      <ProfileImage
        size="24px"
        userName={currentUser?.name || currentUser?.username}
      />
      <Text className="strong" kind="body-s" renderAs="p">
        {currentUser?.name || currentUser?.username || currentUser?.email}
      </Text>
    </ProfileContainer>
  );
};

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 24px solid var(--ads-v2-color-bg-muted);
  padding: var(--ads-v2-spaces-6);
  min-height: 360px;
  gap: 4px;
  height: fit-content;

  .strong {
    font-weight: 500;
  }

  .excerpt {
    color: var(--colors-ui-control-value);
  }
`;

const ImgPreviewContainer = styled.div`
  width: 360px;
  height: 220px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ProfileContainer = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
