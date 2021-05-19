import React, { useCallback, useMemo, useRef, useState } from "react";
import { DraftHandleValue, EditorState } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import ProfileImage, { Profile } from "pages/common/ProfileImage";

import createMentionPlugin, { MentionData } from "@draft-js-plugins/mention";
import styled from "styled-components";

import "@draft-js-plugins/mention/lib/plugin.css";
import "draft-js/dist/Draft.css";
import { getTypographyByKey } from "constants/DefaultTheme";
import { EntryComponentProps } from "@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry";
import UserApi from "api/UserApi";

const StyledMention = styled.span`
  color: ${(props) => props.theme.colors.comments.mention};
`;

export function MentionComponent(props: {
  children: React.ReactNode;
  entityKey: string;
}) {
  const { children } = props;
  return <StyledMention>@{children}</StyledMention>;
}

const StyledSuggestionsComponent = styled.div<{ isFocused?: boolean }>`
  display: flex;
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[6]}px`};

  & ${Profile} {
    margin-right: ${(props) => props.theme.spaces[4]}px;
  }
  align-items: center;

  &:hover {
    background-color: ${(props) => props.theme.colors.mentionSuggestion.hover};
  }

  ${(props) =>
    props.isFocused
      ? `
  background-color: ${props.theme.colors.mentionSuggestion.hover};
  `
      : ""}
`;

const Name = styled.div`
  ${(props) => getTypographyByKey(props, "h5")}
  color: ${(props) => props.theme.colors.mentionSuggestion.nameText};
`;

const Username = styled.div`
  ${(props) => getTypographyByKey(props, "p3")}
  color: ${(props) => props.theme.colors.mentionSuggestion.usernameText};
`;

function SuggestionComponent(props: EntryComponentProps) {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  const { theme, ...parentProps } = props;
  const { user } = props.mention;
  return (
    <StyledSuggestionsComponent {...parentProps}>
      <ProfileImage
        side={25}
        source={`/api/${UserApi.photoURL}/${user.username}`}
        userName={user.username || ""}
      />
      <div>
        <Name>{user.username}</Name>
        <Username>{user.username}</Username>
      </div>
    </StyledSuggestionsComponent>
  );
}

const StyledContainer = styled.div`
  overflow: auto;
  flex: 1;

  & [id^="mentions-list"] {
    padding: 0;
  }
`;

type Props = {
  suggestions: Array<MentionData>;
  onSubmit: (editorState: EditorState) => void;
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  readOnly?: boolean;
  onSearchSuggestions: ({ value }: { value: string }) => void;
  autoFocus: boolean;
  placeholder?: string;
};

function MentionsInput({
  autoFocus,
  editorState,
  onSearchSuggestions,
  onSubmit,
  placeholder,
  setEditorState,
  suggestions,
}: Props) {
  const ref = useRef<Editor | null>(null);
  const [open, setOpen] = useState(false);
  const { MentionSuggestions, plugins } = useMemo(() => {
    const mentionPlugin = createMentionPlugin({
      mentionTrigger: "@",
      mentionComponent: MentionComponent,
    });
    const { MentionSuggestions } = mentionPlugin;
    return { plugins: [mentionPlugin], MentionSuggestions };
  }, []);

  const onOpenChange = useCallback((_open: boolean) => {
    setOpen(_open);
  }, []);

  const handleReturn = useCallback(
    (e: React.KeyboardEvent, editorState: EditorState): DraftHandleValue => {
      if (!e.nativeEvent.shiftKey && !open) {
        onSubmit(editorState);
        return "handled";
      }
      return "not-handled";
    },
    [open],
  );

  const focusInput = useCallback(() => {
    // Forcing focus breaks plugins
    // Ref: https://github.com/draft-js-plugins/draft-js-plugins/issues/800
    setTimeout(() => ref.current?.focus());
  }, []);

  const setRef = useCallback((editorRef) => {
    ref.current = editorRef;
    if (autoFocus) focusInput();
  }, []);

  return (
    <StyledContainer onClick={focusInput}>
      <Editor
        editorKey={"editor"}
        editorState={editorState}
        handleReturn={handleReturn}
        onChange={setEditorState}
        placeholder={placeholder}
        plugins={plugins}
        ref={setRef}
      />
      <MentionSuggestions
        entryComponent={SuggestionComponent}
        onOpenChange={onOpenChange}
        onSearchChange={onSearchSuggestions}
        open={open}
        suggestions={suggestions}
        // onAddMention={() => {
        //   // get the mention object selected
        // }}
      />
    </StyledContainer>
  );
}

export default MentionsInput;
