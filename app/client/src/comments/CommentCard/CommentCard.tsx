import React from "react";
import Editor from "@draft-js-plugins/editor";
import {
  CompositeDecorator,
  convertFromRaw,
  DraftDecorator,
  EditorState,
  RawDraftContentState,
} from "draft-js";
import styled from "styled-components";
import ProfileImage, { Profile } from "pages/common/ProfileImage";
import { Comment } from "entities/Comments/CommentsInterfaces";
// import { getTypographyByKey } from "constants/DefaultTheme";
// import CommentContextMenu from "./CommentContextMenu";

import createMentionPlugin from "@draft-js-plugins/mention";
import { flattenDeep, noop } from "lodash";

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

// const CommentBodyContainer = styled.div`
//   ${(props) => getTypographyByKey(props, "p1")};
//   line-height: 24px;
//   color: ${(props) => props.theme.colors.comments.commentBody};
//   margin-top: ${(props) => props.theme.spaces[3]}px;
// `;

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

const HeaderLeft = styled.div`
  display: flex;
`;

const mentionPlugin = createMentionPlugin();
const plugins = [mentionPlugin];
const decorators = flattenDeep(plugins.map((plugin) => plugin.decorators));
const decorator = new CompositeDecorator(
  decorators.filter((_decorator, index) => index !== 1) as DraftDecorator[],
);

const CommentCard = ({ comment }: { comment: Comment }) => {
  const { authorName, body } = comment;
  const contentState = convertFromRaw(body as RawDraftContentState);
  const editorState = EditorState.createWithContent(contentState, decorator);

  return (
    <StyledContainer data-cy={`t--comment-card-${comment.id}`}>
      <CommentHeader>
        <HeaderLeft>
          <ProfileImage userName={authorName || ""} side={24} />
          <UserName>{authorName}</UserName>
        </HeaderLeft>
        {/* <CommentContextMenu /> */}
      </CommentHeader>
      <Editor
        editorState={editorState}
        plugins={plugins}
        onChange={noop}
        readOnly
      />
    </StyledContainer>
  );
};

export default CommentCard;
