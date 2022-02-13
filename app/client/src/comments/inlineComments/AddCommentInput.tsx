import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import EmojiPicker from "components/ads/EmojiPicker";
import MentionsInput, { Trigger } from "components/ads/MentionsInput";
import Button, { Category } from "components/ads/Button";

import { BaseEmoji } from "emoji-mart";
import styled from "styled-components";
import { EditorState, convertToRaw, Modifier, SelectionState } from "draft-js";
import { MentionData } from "@draft-js-plugins/mention";

import { OrgUser } from "constants/orgConstants";
import useOrgUsers from "./useOrgUsers";

import { RawDraftContentState } from "draft-js";

import {
  createMessage,
  ADD_COMMENT_PLACEHOLDER,
  CANCEL,
  POST,
  INVALID_EMAIL,
} from "@appsmith/constants/messages";

import { setShowAppInviteUsersDialog } from "actions/applicationActions";
import { useDispatch, useSelector } from "react-redux";
import { change } from "redux-form";

import { INVITE_USERS_TO_ORG_FORM } from "constants/forms";

import { isEmail } from "utils/formhelpers";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";
import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";
import { getCurrentAppOrg } from "selectors/organizationSelectors";
import useOrg from "utils/hooks/useOrg";
import { getCanCreateApplications } from "utils/helpers";

import { getAppsmithConfigs } from "@appsmith/configs";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

const { appsmithSupportEmail } = getAppsmithConfigs();

const StyledInputContainer = styled.div`
  width: 100%;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const StyledEmojiTrigger = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: ${(props) => props.theme.spaces[4]}px;
`;

const PaddingContainer = styled.div<{ removePadding?: boolean }>`
  padding: ${(props) =>
    !props.removePadding
      ? `${props.theme.spaces[7]}px ${props.theme.spaces[5]}px`
      : 0};

  & .cancel-button {
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
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

const appsmithSupport = {
  name: "appsmith",
  user: { username: appsmithSupportEmail, name: "appsmith" },
  isSupport: true,
};

const getSortIndex = (a: number, b: number) => {
  if (a === -1 && b !== -1) return b;
  if (b === -1 && a !== -1) return a;
  return a - b;
};

const sortMentionData = (filter = "") => (a: MentionData, b: MentionData) => {
  let sortIndex = 0;
  const nameA = a.name?.toLowerCase() || "";
  const nameB = b.name?.toLowerCase() || "";
  const usernameA = a.user?.username?.toLowerCase() || "";
  const usernameB = b.user?.username?.toLowerCase() || "";

  if (filter) {
    const nameIndexA = nameA.indexOf(filter);
    const nameIndexB = nameB.indexOf(filter);
    sortIndex = getSortIndex(nameIndexA, nameIndexB);
    if (sortIndex) return sortIndex;

    const usernameIndexA = usernameA.indexOf(filter);
    const usernameIndexB = usernameB.indexOf(filter);
    sortIndex = getSortIndex(usernameIndexA, usernameIndexB);
    if (sortIndex) return sortIndex;
  }

  sortIndex = nameA.localeCompare(nameB);
  if (sortIndex) return sortIndex;

  return usernameA.localeCompare(usernameB);
};

const useUserSuggestions = (
  users: Array<OrgUser>,
  setSuggestions: Dispatch<SetStateAction<Array<MentionData>>>,
) => {
  const { id } = useSelector(getCurrentAppOrg) || {};
  const currentOrg = useOrg(id);
  const canManage = getCanCreateApplications(currentOrg);

  useEffect(() => {
    const result: Array<MentionData> = users.map((user) => ({
      name: user.name || user.username,
      user,
    }));

    result.sort(sortMentionData());

    if (canManage) result.unshift(appsmithSupport);

    setSuggestions(result);
  }, [users, canManage]);
};

function AddCommentInput({
  initialEditorState,
  onCancel,
  onChange,
  onSave,
  removePadding,
}: {
  removePadding?: boolean;
  initialEditorState?: EditorState | null;
  onSave: (state: RawDraftContentState) => void;
  onCancel?: () => void;
  onChange?: (newEditorState: EditorState) => void;
}) {
  const proceedToNextTourStep = useProceedToNextTourStep({
    [TourType.COMMENTS_TOUR_EDIT_MODE]:
      commentsTourStepsEditModeTypes.SAY_HELLO,
    [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
      commentsTourStepsPublishedModeTypes.SAY_HELLO,
  });

  const dispatch = useDispatch();
  const users = useOrgUsers();
  const [suggestions, setSuggestions] = useState<Array<MentionData>>([]);
  const [trigger, setTrigger] = useState<Trigger>();
  useUserSuggestions(users, setSuggestions);
  const [editorState, setEditorStateInState] = useState(
    initialEditorState || EditorState.createEmpty(),
  );

  const setEditorState = useCallback((updatedEditorState: EditorState) => {
    setEditorStateInState(updatedEditorState);
    if (typeof onChange === "function") {
      onChange(updatedEditorState);
    }
  }, []);

  const [suggestionsQuery, setSuggestionsQuery] = useState("");

  const clearEditor = useCallback(() => {
    setEditorState(resetEditorState(editorState));
  }, [editorState]);

  const _onCancel = () => {
    clearEditor();
    if (onCancel) onCancel();
  };

  const onSaveComment = useCallback(
    (editorStateArg?: EditorState) => {
      const latestEditorState = editorStateArg || editorState;
      const plainText = latestEditorState.getCurrentContent().getPlainText();

      if (!plainText || plainText.trim().length === 0) return;

      const contentState = latestEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      clearEditor();
      onSave(rawContent);
      proceedToNextTourStep();
    },
    [editorState],
  );
  const handleSubmit = useCallback(() => onSaveComment(), [editorState]);

  const handleEmojiClick = useCallback(
    (e: React.MouseEvent, emojiObject: BaseEmoji) => {
      const newEditorState = insertCharacter(emojiObject.native, editorState);
      setEditorState(newEditorState);
    },
    [editorState],
  );

  const onSearchChange = useCallback(
    ({ trigger, value }: { trigger: string; value: string }) => {
      setSuggestionsQuery(value);
      setTrigger(trigger as Trigger);
    },
    [suggestions],
  );

  const filteredSuggestions = useMemo(() => {
    let suggestionResults = suggestions;
    let hasExactMatch = false;
    if (!suggestionsQuery) return suggestionResults;
    else {
      const filter = suggestionsQuery.toLowerCase();
      suggestionResults = suggestions
        .filter((suggestion) => {
          const name = suggestion.name.toLowerCase();
          const username = suggestion.user?.username.toLowerCase() || "";
          hasExactMatch = name === filter || username === filter;
          return name.indexOf(filter) !== -1 || username.indexOf(filter) !== -1;
        })
        .sort(sortMentionData(filter));
    }
    const couldBeNewEmail = isEmail(suggestionsQuery);
    const inviteNew = [{ name: suggestionsQuery, isInviteTrigger: true }];
    // Show invite prompt only if there is no exact match and user has typed email.
    return [
      ...suggestionResults,
      ...(couldBeNewEmail && !hasExactMatch ? inviteNew : []),
    ];
  }, [suggestionsQuery, suggestions, trigger]);

  const onAddMention = (mention: MentionData) => {
    if (
      (isEmail(mention.name) && mention.isInviteTrigger) ||
      mention.isSupport
    ) {
      const email = mention.isSupport ? mention.user?.username : mention.name;
      dispatch(setShowAppInviteUsersDialog(true));
      dispatch(change(INVITE_USERS_TO_ORG_FORM, "users", email));
    } else if (mention.isInviteTrigger && !isEmail(mention.name)) {
      Toaster.show({
        text: createMessage(INVALID_EMAIL),
        variant: Variant.danger,
      });
    }
  };

  return (
    <TourTooltipWrapper
      activeStepConfig={{
        [TourType.COMMENTS_TOUR_EDIT_MODE]:
          commentsTourStepsEditModeTypes.SAY_HELLO,
        [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
          commentsTourStepsPublishedModeTypes.SAY_HELLO,
      }}
    >
      <PaddingContainer removePadding={removePadding}>
        <Row>
          <StyledInputContainer>
            <MentionsInput
              autoFocus
              editorState={editorState}
              onAddMention={onAddMention}
              onSearchSuggestions={onSearchChange}
              onSubmit={onSaveComment}
              placeholder={createMessage(ADD_COMMENT_PLACEHOLDER)}
              setEditorState={setEditorState}
              suggestions={filteredSuggestions}
            />
          </StyledInputContainer>
        </Row>
        <Row>
          <StyledEmojiTrigger>
            <EmojiPicker onSelectEmoji={handleEmojiClick} />
          </StyledEmojiTrigger>
          <Row>
            <Button
              category={Category.tertiary}
              className={"cancel-button"}
              data-cy="add-comment-cancel"
              onClick={_onCancel}
              text={createMessage(CANCEL)}
            />
            <Button
              category={Category.primary}
              data-cy="add-comment-submit"
              disabled={!editorState.getCurrentContent().hasText()}
              onClick={handleSubmit}
              text={createMessage(POST)}
            />
          </Row>
        </Row>
      </PaddingContainer>
    </TourTooltipWrapper>
  );
}

export default AddCommentInput;
