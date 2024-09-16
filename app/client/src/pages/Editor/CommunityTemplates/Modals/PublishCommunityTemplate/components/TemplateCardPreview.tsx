import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import { Text } from "@appsmith/ads";
import ProfileImage from "pages/common/ProfileImage";
import React from "react";
import { useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  TemplatePreviewCardContainer,
  TemplatePreviewImgPreviewContainer,
  TemplatePreviewProfileContainer,
} from "../StyledComponents";

interface Props {
  excerpt: string;
  templateName: string;
  useCases: string[];
}

const TemplateCardPreview = ({ excerpt, templateName, useCases }: Props) => {
  return (
    <TemplatePreviewCardContainer>
      <TemplatePreviewImgPreviewContainer>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.publishFormPage.preview.thumbnail)}
        </Text>
      </TemplatePreviewImgPreviewContainer>
      <Text
        data-testid="t--community-template-name-preview"
        kind="heading-m"
        renderAs="h2"
      >
        {templateName}
      </Text>
      <Text
        className="strong"
        data-testid="t--community-template-usecases-preview"
        kind="body-m"
        renderAs="p"
      >
        {useCases.join(" • ")}
      </Text>
      <Text
        className="excerpt"
        data-testid="t--community-template-excerpt-preview"
        kind="body-m"
        renderAs="p"
      >
        {excerpt}
      </Text>
      <UserProfile />
    </TemplatePreviewCardContainer>
  );
};

export default TemplateCardPreview;

const UserProfile = () => {
  const currentUser = useSelector(getCurrentUser);

  return (
    <TemplatePreviewProfileContainer>
      <ProfileImage
        size="24px"
        userName={currentUser?.name || currentUser?.username}
      />
      <Text className="strong" kind="body-s" renderAs="p">
        {currentUser?.name || currentUser?.email}
      </Text>
    </TemplatePreviewProfileContainer>
  );
};
