import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Icon, { IconSize } from "components/ads/Icon";
import styled, { withTheme } from "styled-components";
import { EditorState, convertToRaw, Modifier, SelectionState } from "draft-js";
import EmojiPicker from "components/ads/EmojiPicker";
import MentionsInput from "components/ads/MentionsInput";
import useOrgUsers from "./useOrgUsers";
import { MentionData } from "@draft-js-plugins/mention";
import { OrgUser } from "constants/orgConstants";
import { IEmojiData } from "emoji-picker-react";

import { createMessage, ADD_COMMENT_PLACEHOLDER } from "constants/messages";

const StyledInputContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
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

// Ref: https://github.com/facebook/draft-js/issues/445#issuecomment-223860229
const resetEditorState = (editorState: EditorState) => {
  let contentState = editorState.getCurrentContent();
  const firstBlock = contentState.getFirstBlock();
  const lastBlock = contentState.getLastBlock();
  const allSelected = new SelectionState({
    anchorKey: firstBlock.getKey(),
    anchorOffset: 0,
    focusKey: lastBlock.getKey(),
    focusOffset: lastBlock.getLength(),
    hasFocus: true,
  });
  contentState = Modifier.removeRange(contentState, allSelected, "backward");
  editorState = EditorState.push(editorState, contentState, "remove-range");
  editorState = EditorState.forceSelection(
    editorState,
    contentState.getSelectionAfter(),
  );

  return editorState;
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
  const [suggestionsQuery, setSuggestionsQuery] = useState("");

  const onSaveComment = useCallback(
    (editorStateArg?: EditorState) => {
      const latestEditorState = editorStateArg || editorState;

      if (!latestEditorState.getCurrentContent().hasText()) return;

      const contentState = latestEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      onSave(rawContent);
      setEditorState(resetEditorState(latestEditorState));
    },
    [editorState],
  );
  const handleSubmit = useCallback(() => onSaveComment(), [editorState]);

  const handleEmojiClick = useCallback(
    (e: React.MouseEvent, emojiObject: IEmojiData) => {
      const newEditorState = insertCharacter(emojiObject.emoji, editorState);
      setEditorState(newEditorState);
    },
    [editorState],
  );

  const onSearchChange = useCallback(
    ({ value }: { value: string }) => {
      setSuggestionsQuery(value);
    },
    [suggestions],
  );

  const filteredSuggestions = useMemo(() => {
    if (!suggestionsQuery) return suggestions;
    else {
      return suggestions.filter((suggestion) => {
        const str = suggestion.name.toLowerCase();
        const filter = suggestionsQuery.toLowerCase();
        return str.indexOf(filter) !== -1;
      });
    }
  }, [suggestionsQuery, suggestions]);

  return (
    <PaddingContainer>
      <StyledInputContainer>
        <MentionsInput
          autoFocus
          editorState={editorState}
          onSearchSuggestions={onSearchChange}
          onSubmit={onSaveComment}
          placeholder={createMessage(ADD_COMMENT_PLACEHOLDER)}
          setEditorState={setEditorState}
          suggestions={filteredSuggestions}
        />
        <StyledEmojiTrigger>
          <EmojiPicker onSelectEmoji={handleEmojiClick} />
        </StyledEmojiTrigger>
        <StyledSendButton data-cy="add-comment-submit" onClick={handleSubmit}>
          <Icon
            fillColor={theme.colors.comments.sendButton}
            name="send-button"
            size={IconSize.XL}
          />
        </StyledSendButton>
      </StyledInputContainer>
    </PaddingContainer>
  );
});

export default AddCommentInput;
