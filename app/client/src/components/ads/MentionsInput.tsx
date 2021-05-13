import React, { useCallback, useMemo, useRef, useState } from "react";
import { DraftHandleValue, EditorState } from "draft-js";
import Editor from "@draft-js-plugins/editor";
import createMentionPlugin, { MentionData } from "@draft-js-plugins/mention";
import styled from "styled-components";

import "@draft-js-plugins/mention/lib/plugin.css";
import "draft-js/dist/Draft.css";

const StyledContainer = styled.div`
  max-height: 60px;
  overflow: auto;
  flex: 1;
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
    const mentionPlugin = createMentionPlugin({ mentionTrigger: "@" });
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
