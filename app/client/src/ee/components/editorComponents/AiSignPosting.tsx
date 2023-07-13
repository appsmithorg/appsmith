import styled from "styled-components";
import React from "react";
import SignPostingBanner from "components/designSystems/appsmith/SignPostingBanner";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

export type AISignPostingProps = {
  isOpen?: boolean;
  mode?: TEditorModes;
  forComp?: string;
};

const SubContent = styled.div`
  color: var(--ads-v2-color-fg-muted);
`;

export function AIPost(props: { title: string }) {
  return (
    <div className="">
      <div className="text-sm mb-2">{props.title}</div>
      <SubContent className="text-xs">
        Use <span className="font-semibold">/ai</span>, to open Appsmith AI
      </SubContent>
    </div>
  );
}

function AISignPosting(props: AISignPostingProps) {
  const isJavascriptMode = props.mode === EditorModes.TEXT_WITH_BINDING;

  let containerClasses = "absolute -bottom-[2px] translate-y-full w-full";

  if (!isJavascriptMode) {
    containerClasses = "mb-2 w-fit";
  }

  const title = isJavascriptMode
    ? "Generate javascript code"
    : "Generate SQL query";

  /** We show this prompt on the editor only for TEXT_WITH_BINDING   */
  if (
    props.forComp === "editor" &&
    props.mode !== EditorModes.TEXT_WITH_BINDING
  ) {
    return null;
  }

  return (
    <div
      className={`${containerClasses} ${
        props.isOpen ? "visible" : "invisible"
      } t--no-binding-prompt`}
    >
      <SignPostingBanner
        content={<AIPost title={title} />}
        iconName="magic-line"
      />
    </div>
  );
}

export default AISignPosting;
