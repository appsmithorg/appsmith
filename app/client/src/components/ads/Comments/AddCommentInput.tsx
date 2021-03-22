import React, { useState } from "react";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import EmojiPicker from "./EmojiPicker";

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
`;

const StyledSendButton = styled.button`
  display: inline-flex;
  background: transparent;
  border: none;
  align-items: center;
  position: relative;
  top: -1px;
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

/** TODO: make input autogrow */
const StyledTextArea = styled.textarea`
  flex: 1;
  border: none;
  ${(props) => getTypographyByKey(props, "p1")};
  line-height: 24px;
  color: ${(props) => props.theme.colors.comments.commentBody};
  background: ${(props) =>
    props.theme.colors.comments.addCommentInputBackground};
  word-wrap: break-word;
  word-break: break-word;
  resize: none;
  outline: none;
  height: 29px;
`;

const AddCommentInput = withTheme(({ onSave, theme }: any) => {
  const [value, setValue] = useState("");
  const onSaveComment = () => {
    onSave(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    if (isEnterKey && !e.shiftKey) {
      onSaveComment();
      e.preventDefault();
    }
  };

  const handleEmojiClick = (e: any, emojiObject: any) => {
    setValue(`${value}${emojiObject.emoji}`);
  };

  return (
    <PaddingContainer>
      <StyledInputContainer>
        <StyledTextArea
          onChange={(e) => setValue(e.target.value)}
          value={value}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <StyledEmojiTrigger>
          <EmojiPicker onSelectEmoji={handleEmojiClick} />
        </StyledEmojiTrigger>
        <StyledSendButton onClick={onSaveComment}>
          <Icon
            name="send-button"
            fillColor={theme.colors.comments.sendButton}
            size={IconSize.XL}
          />
        </StyledSendButton>
      </StyledInputContainer>
    </PaddingContainer>
  );
});

export default AddCommentInput;
