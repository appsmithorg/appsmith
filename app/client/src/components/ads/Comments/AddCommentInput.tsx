import React, { useState } from "react";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

const StyledInputContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};

  border: 1px solid
    ${(props) => props.theme.colors.comments.addCommentInputBorder};
  background: ${(props) =>
    props.theme.colors.comments.addCommentInputBackground};

  & input {
    flex: 1;
    border: none;
    ${(props) => getTypographyByKey(props, "p1")};
    line-height: 24px;
    color: ${(props) => props.theme.colors.comments.commentBody};
    background: ${(props) =>
      props.theme.colors.comments.addCommentInputBackground};
  }
`;

const StyledSendButton = styled.button`
  display: inline-flex;
  background: transparent;
  border: none;
  align-items: center;
`;

const StyledEmojiTrigger = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: ${(props) => props.theme.spaces[4]}px;
`;

const PaddingContainer = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[6]}px`};
  padding-top: 0;
`;

const AddCommentInput = withTheme(({ onSave, theme }: any) => {
  const [value, setValue] = useState("");

  return (
    <PaddingContainer>
      <StyledInputContainer>
        <input onChange={(e) => setValue(e.target.value)} value={value} />
        <StyledEmojiTrigger>
          <Icon name="emoji" size={IconSize.LARGE} />
        </StyledEmojiTrigger>
        <StyledSendButton onClick={() => onSave(value)}>
          <Icon
            name="send-button"
            fillColor={theme.colors.comments.sendButton}
            size={IconSize.XL}
          />
        </StyledSendButton>{" "}
      </StyledInputContainer>
    </PaddingContainer>
  );
});

export default AddCommentInput;
