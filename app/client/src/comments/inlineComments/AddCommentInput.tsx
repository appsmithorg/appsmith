import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { withTheme } from "styled-components";
import { EditorState, convertToRaw, Modifier } from "draft-js";
import EmojiPicker from "components/ads/EmojiPicker";
import MentionsInput from "components/ads/MentionsInput";
import useOrgUsers from "./useOrgUsers";
import {
  defaultSuggestionsFilter,
  MentionData,
} from "@draft-js-plugins/mention";
import { OrgUser } from "constants/orgConstants";

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

const insertCharacter = (
  characterToInsert: string,
  editorState: EditorState,
) => {
  const currentContent = editorState.getCurrentContent(),
    currentSelection = editorState.getSelection();

  const newContent = Modifier.replaceText(
    currentContent,
    currentSelection,
    characterToInsert,
  );

  const newEditorState = EditorState.push(
    editorState,
    newContent,
    "insert-characters",
  );

  return EditorState.forceSelection(
    newEditorState,
    newContent.getSelectionAfter(),
  );
};

const useUserSuggestions = (
  users: Array<OrgUser>,
  setSuggestions: Dispatch<SetStateAction<Array<MentionData>>>,
) => {
  useEffect(() => {
    setSuggestions(users.map((user) => ({ name: user.username })));
  }, [users]);
};

const AddCommentInput = withTheme(({ onSave, theme }: any) => {
  const users = useOrgUsers();
  const [suggestions, setSuggestions] = useState<Array<MentionData>>([]);
  useUserSuggestions(users, setSuggestions);
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const onSaveComment = useCallback(
    (editorStateArg?: EditorState) => {
      const latestEditorState = editorStateArg || editorState;
      const contentState = latestEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      onSave(JSON.stringify(rawContent));
      setEditorState(EditorState.createEmpty());
    },
    [editorState],
  );
  const handleSubmit = useCallback(() => onSaveComment(), [editorState]);

  const handleEmojiClick = useCallback(
    (e: any, emojiObject: any) => {
      const newEditorState = insertCharacter(emojiObject.emoji, editorState);
      setEditorState(newEditorState);
    },
    [editorState],
  );

  const onSearchChange = useCallback(
    ({ value }: { value: string }) => {
      setSuggestions(defaultSuggestionsFilter(value, suggestions));
    },
    [suggestions],
  );

  return (
    <>
      <PaddingContainer>
        <StyledInputContainer>
          <MentionsInput
            suggestions={suggestions}
            editorState={editorState}
            setEditorState={setEditorState}
            onSubmit={onSaveComment}
            onSearchSuggestions={onSearchChange}
            autoFocus
          />
          <StyledEmojiTrigger>
            <EmojiPicker onSelectEmoji={handleEmojiClick} />
          </StyledEmojiTrigger>
          <StyledSendButton onClick={handleSubmit} data-cy="add-comment-submit">
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
