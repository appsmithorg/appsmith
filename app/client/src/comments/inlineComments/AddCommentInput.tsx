import React, { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { withTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import EmojiPicker from "components/ads/EmojiPicker";
import MentionsInput, {
  Mention,
} from "components/ads/MentionsInput/MentionsInput";
import useAutoGrow from "utils/hooks/useAutoGrow";

import { getAllUsers } from "selectors/organizationSelectors";

const style = {
  input: {
    overflow: "auto",
  },
  highlighter: {
    boxSizing: "border-box",
    overflow: "hidden",
  },
};

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

const StyledMentionsInput = styled(MentionsInput)`
  flex: 1;
  border: none;
  ${(props) => getTypographyByKey(props, "p1")};

  color: ${(props) => props.theme.colors.comments.commentBody};
  background: ${(props) =>
    props.theme.colors.comments.addCommentInputBackground};
  word-wrap: break-word;
  word-break: break-word;
  resize: none;
  outline: none;
  & textarea {
    overflow: auto;
    line-height: 19px;
    overflow: auto;
    border: none;
  }
`;

const MAX_INPUT_HEIGHT = 96;
const MIN_INPUT_HEIGHT = 24;
const getInputHeight = (scrollHeight: number) => {
  const height = Math.min(scrollHeight, MAX_INPUT_HEIGHT);
  return Math.max(height, MIN_INPUT_HEIGHT);
};

const AddCommentInput = withTheme(({ onSave, theme }: any) => {
  // TODO: pass data as a prop
  const users = useSelector(getAllUsers) || [];
  const [value, setValue] = useState("");
  const onSaveComment = useCallback(() => {
    onSave(value);
    setValue("");
  }, [value]);

  const handleSubmitOnKeyDown = useCallback(
    (
      e:
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.KeyboardEvent<HTMLInputElement>,
    ) => {
      const isEnterKey = e.key === "Enter" || e.keyCode === 13;
      if (isEnterKey && !e.shiftKey) {
        onSaveComment();
        e.preventDefault();
      }
    },
    [value],
  );

  const handleEmojiClick = (e: any, emojiObject: any) => {
    setValue(`${value}${emojiObject.emoji}`);
  };

  const mentionsInputRef = useRef<HTMLTextAreaElement>(null);
  const height = useAutoGrow(mentionsInputRef.current);
  const calcHeight = useMemo(() => {
    return getInputHeight((height as number) || 0);
  }, [height]);

  return (
    <>
      <PaddingContainer>
        <StyledInputContainer>
          <StyledMentionsInput
            onKeyDown={handleSubmitOnKeyDown}
            inputRef={mentionsInputRef}
            onChange={(e: any) => {
              setValue(e.target.value);
            }}
            value={value}
            autoFocus
            data-cy="add-comment-input"
            style={{
              input: {
                ...style.input,
                height: calcHeight,
                maxHeight: MAX_INPUT_HEIGHT,
              },
              highlighter: {
                ...style.highlighter,
                height: calcHeight,
                maxHeight: MAX_INPUT_HEIGHT,
              },
            }}
          >
            {users && (
              <Mention
                markup="@[__display__](user:__id__)"
                trigger="@"
                data={users.map((user) => ({
                  display: user.username,
                  id: user.username,
                }))}
                displayTransform={(id: string, display: string) =>
                  `@${display}`
                }
              />
            )}
          </StyledMentionsInput>
          <StyledEmojiTrigger>
            <EmojiPicker onSelectEmoji={handleEmojiClick} />
          </StyledEmojiTrigger>
          <StyledSendButton
            onClick={onSaveComment}
            data-cy="add-comment-submit"
          >
            <Icon
              name="send-button"
              fillColor={theme.colors.comments.sendButton}
              size={IconSize.XL}
            />
          </StyledSendButton>
        </StyledInputContainer>
      </PaddingContainer>
    </>
  );
});

export default AddCommentInput;
