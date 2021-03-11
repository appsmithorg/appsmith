import React from "react";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import Icon, { IconSize } from "components/ads/Icon";
import ProfileImage, { Profile } from "pages/common/ProfileImage";

const StyledContainer = styled.div`
  width: 100%;
  padding: ${(props) => props.theme.spaces[7]}px;
  padding-top: 0;
  & ${Profile} {
    border: 1px solid
      ${(props) => props.theme.colors.comments.profileImageBorder};
  }
  max-width: 300px;
  border-radius: 0;
`;

const CommentBody = styled.div`
  ${(props) => getTypographyByKey(props, "p1")};
  line-height: 24px;
  color: ${(props) => props.theme.colors.comments.commentBody};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserName = styled.span`
  color: ${(props) => props.theme.colors.comments.profileUserName};
  margin-left: ${(props) => props.theme.spaces[4]}px;
  display: flex;
  align-items: center;
`;

// eslint-disable-next-line
const CommentCard = ({ comment, theme }: { comment: any; theme: Theme }) => {
  const userName = "sampleUserName";
  const bodyText = "@Bruce Can we change the title to something else";

  return (
    <StyledContainer>
      <CommentHeader>
        <div style={{ display: "flex" }}>
          <ProfileImage userName={userName} side={24} />
          <UserName>{userName}</UserName>
        </div>
        <Icon
          name="card-context-menu"
          fillColor={theme.colors.comments.profileUserName}
          size={IconSize.LARGE}
        />
      </CommentHeader>
      <CommentBody>{bodyText}</CommentBody>
    </StyledContainer>
  );
};

export default withTheme(CommentCard);
