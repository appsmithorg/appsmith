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

import Icon from "components/ads/Icon";

import { INVITE_A_NEW_USER, createMessage } from "@appsmith/constants/messages";
import { USER_PHOTO_URL } from "constants/userConstants";

import scrollIntoView from "scroll-into-view-if-needed";
import { useEffect } from "react";

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

export enum Trigger {
  "@" = "@",
  "+" = "+",
}

const StyledSuggestionsComponent = styled.div<{ isFocused?: boolean }>`
  display: flex;
  width: 250px;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
`;

const Username = styled.div`
  ${(props) => getTypographyByKey(props, "p3")}
  color: ${(props) => props.theme.colors.mentionSuggestion.usernameText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre;
`;

const PlusCircle = styled.div`
  width: 25px;
  height: 25px;
  display: flex;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(props) =>
    props.theme.colors.mentionsInput.mentionsInviteBtnPlusIcon};
  & svg path {
    stroke: #fff;
  }
  margin-right: ${(props) => props.theme.spaces[4]}px;
  flex-shrink: 0;
`;

const SuggestionRightContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

function SuggestionComponent(props: EntryComponentProps) {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  const { theme, ...parentProps } = props;
  const { user } = props.mention;
  const mentionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (parentProps.isFocused && mentionRef.current) {
      scrollIntoView(mentionRef.current, {
        scrollMode: "if-needed",
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [parentProps.isFocused]);

  if (props.mention?.isInviteTrigger) {
    return (
      <StyledSuggestionsComponent ref={mentionRef} {...parentProps}>
        <PlusCircle>
          <Icon fillColor="#fff" name="plus" />
        </PlusCircle>
        <SuggestionRightContainer>
          <Name>{createMessage(INVITE_A_NEW_USER)}</Name>
          <Username>{props.mention.name}</Username>
        </SuggestionRightContainer>
      </StyledSuggestionsComponent>
    );
  }

  return (
    <StyledSuggestionsComponent ref={mentionRef} {...parentProps}>
      <div style={{ flexShrink: 0 }}>
        <ProfileImage
          side={25}
          source={`/api/${USER_PHOTO_URL}/${user?.username}`}
          userName={user?.username || ""}
        />
      </div>
      <SuggestionRightContainer>
        <Name>{props.mention.name}</Name>
        <Username>{user?.username}</Username>
      </SuggestionRightContainer>
    </StyledSuggestionsComponent>
  );
}

const StyledContainer = styled.div`
  overflow: auto;
  flex: 1;

  .mentions-list {
    position: absolute;
    background: #fff;
    border-radius: 2px;
    box-shadow: 0px 4px 30px 0px rgb(220 220 220);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    overflow: auto;
    max-height: 300px;
    z-index: 2;
  }
`;

type Props = {
  suggestions: Array<MentionData>;
  onSubmit: (editorState: EditorState) => void;
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  readOnly?: boolean;
  onSearchSuggestions: (props: { value: string; trigger: string }) => void;
  autoFocus: boolean;
  placeholder?: string;
  onAddMention?: (mention: MentionData) => void;
};

function MentionsInput({
  autoFocus,
  editorState,
  onAddMention,
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
      mentionRegExp: "[\\w@\\._]",
      mentionTrigger: ["@", "+"],
      mentionComponent: MentionComponent,
      theme: {
        mentionSuggestions: "mentions-list",
      },
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
        webDriverTestID="mentions-input"
      />
      <MentionSuggestions
        entryComponent={SuggestionComponent}
        onAddMention={(mention: MentionData) => {
          if (onAddMention) {
            onAddMention(mention);
          }
        }}
        onOpenChange={onOpenChange}
        onSearchChange={onSearchSuggestions}
        open={open}
        suggestions={suggestions}
      />
    </StyledContainer>
  );
}

export default MentionsInput;
