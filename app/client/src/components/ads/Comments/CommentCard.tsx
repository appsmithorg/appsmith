import React from "react";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import ProfileImage, { Profile } from "pages/common/ProfileImage";
// import CommentContextMenu from "./CommentContextMenu";

const StyledContainer = styled.div`
  width: 100%;
  padding: ${(props) => props.theme.spaces[7]}px;
  padding-top: 0;
  & ${Profile} {
    border: 1px solid
      ${(props) => props.theme.colors.comments.profileImageBorder};
  }
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

const CommentCard = ({ comment }: { comment: any }) => {
  const { authorName, body } = comment;
  return (
    <StyledContainer data-cy={`t--comment-card-${comment.id}`}>
      <CommentHeader>
        <div style={{ display: "flex" }}>
          <ProfileImage userName={authorName || ""} side={24} />
          <UserName>{authorName}</UserName>
        </div>
        {/* <CommentContextMenu /> */}
      </CommentHeader>
      <CommentBody>{body}</CommentBody>
    </StyledContainer>
  );
};

export default CommentCard;
